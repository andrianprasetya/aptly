package main

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func testRouter(g *rateGuard) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.POST("/x", g.middleware(), func(c *gin.Context) { c.Status(http.StatusOK) })
	return r
}

func fire(r *gin.Engine, ip string) int {
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/x", nil)
	req.RemoteAddr = ip + ":5555"
	r.ServeHTTP(w, req)
	return w.Code
}

func TestRateGuard_BurstBlocks(t *testing.T) {
	r := testRouter(newRateGuard())
	// First perIPBurst requests pass, the next is throttled.
	for i := 0; i < perIPBurst; i++ {
		if code := fire(r, "1.2.3.4"); code != http.StatusOK {
			t.Fatalf("request %d: got %d, want 200", i+1, code)
		}
	}
	if code := fire(r, "1.2.3.4"); code != http.StatusTooManyRequests {
		t.Fatalf("after burst: got %d, want 429", code)
	}
}

func TestRateGuard_IPsIsolated(t *testing.T) {
	r := testRouter(newRateGuard())
	for i := 0; i < perIPBurst+2; i++ {
		fire(r, "10.0.0.1") // exhaust IP A
	}
	// A fresh IP must still be served.
	if code := fire(r, "10.0.0.2"); code != http.StatusOK {
		t.Fatalf("isolated IP: got %d, want 200", code)
	}
}
