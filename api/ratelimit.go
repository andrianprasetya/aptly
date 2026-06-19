package main

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

// Abuse/cost guard for the public, no-login analyze endpoint. The OpenAI
// dashboard spend cap is the real backstop; these limits bound the blast radius
// so a single abuser can't drain the budget. In-memory + per-instance — move to
// Redis/Upstash if this ever runs on more than one instance.
const (
	perIPBurst   = 5                // up to 5 quick requests...
	perIPRefill  = 12 * time.Second // ...then ~1 every 12s (~5/min)
	perIPPerDay  = 50               // rolling 24h cap per IP
	globalPerDay = 500              // rolling 24h cap across all IPs
	ipEntryTTL   = time.Hour        // forget idle IPs after this
)

type ipState struct {
	limiter  *rate.Limiter
	dayCount int
	dayReset time.Time
	lastSeen time.Time
}

type rateGuard struct {
	mu          sync.Mutex
	ips         map[string]*ipState
	globalCount int
	globalReset time.Time
}

func newRateGuard() *rateGuard {
	g := &rateGuard{
		ips:         make(map[string]*ipState),
		globalReset: time.Now().Add(24 * time.Hour),
	}
	go g.cleanupLoop()
	return g
}

// middleware enforces the global daily guard, the per-IP daily cap, and the
// per-IP burst rate, in that order. Counts are incremented only for requests
// that pass all checks.
func (g *rateGuard) middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		now := time.Now()
		// Assumes the platform (Render/Fly) sets X-Forwarded-For; Gin's
		// ClientIP reads it. Spoofable in theory — acceptable for a prototype.
		ip := c.ClientIP()

		g.mu.Lock()

		if now.After(g.globalReset) {
			g.globalCount = 0
			g.globalReset = now.Add(24 * time.Hour)
		}
		if g.globalCount >= globalPerDay {
			g.mu.Unlock()
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error": "daily capacity reached, please try again tomorrow",
			})
			return
		}

		st := g.ips[ip]
		if st == nil {
			st = &ipState{
				limiter:  rate.NewLimiter(rate.Every(perIPRefill), perIPBurst),
				dayReset: now.Add(24 * time.Hour),
			}
			g.ips[ip] = st
		}
		if now.After(st.dayReset) {
			st.dayCount = 0
			st.dayReset = now.Add(24 * time.Hour)
		}
		st.lastSeen = now

		if st.dayCount >= perIPPerDay {
			g.mu.Unlock()
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error": "daily limit reached for your address, please try again tomorrow",
			})
			return
		}
		if !st.limiter.Allow() {
			g.mu.Unlock()
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error": "too many requests, please slow down",
			})
			return
		}

		st.dayCount++
		g.globalCount++
		g.mu.Unlock()

		c.Next()
	}
}

// cleanupLoop evicts idle IP entries so the map can't grow unbounded.
func (g *rateGuard) cleanupLoop() {
	ticker := time.NewTicker(10 * time.Minute)
	defer ticker.Stop()
	for range ticker.C {
		cutoff := time.Now().Add(-ipEntryTTL)
		g.mu.Lock()
		for ip, st := range g.ips {
			if st.lastSeen.Before(cutoff) {
				delete(g.ips, ip)
			}
		}
		g.mu.Unlock()
	}
}
