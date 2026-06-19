package main

import (
	"context"
	"encoding/json"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

const turnstileVerifyURL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"

// turnstileMiddleware verifies a Cloudflare Turnstile token before the request
// reaches the analyze handler — a bot/abuse guard for the public, no-login
// endpoint. If TURNSTILE_SECRET is unset it's a no-op, so local dev (and the
// build) work without keys; set the secret in prod to enforce it.
func turnstileMiddleware() gin.HandlerFunc {
	secret := os.Getenv("TURNSTILE_SECRET")
	client := &http.Client{Timeout: 8 * time.Second}

	return func(c *gin.Context) {
		if secret == "" {
			c.Next()
			return
		}
		token := c.GetHeader("X-Turnstile-Token")
		if token == "" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "missing verification token"})
			return
		}
		if !verifyTurnstile(c.Request.Context(), client, secret, token, c.ClientIP()) {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "verification failed, please reload and try again"})
			return
		}
		c.Next()
	}
}

func verifyTurnstile(ctx context.Context, client *http.Client, secret, token, ip string) bool {
	form := url.Values{}
	form.Set("secret", secret)
	form.Set("response", token)
	if ip != "" {
		form.Set("remoteip", ip)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, turnstileVerifyURL, strings.NewReader(form.Encode()))
	if err != nil {
		return false
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := client.Do(req)
	if err != nil {
		return false
	}
	defer resp.Body.Close()

	var out struct {
		Success bool `json:"success"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return false
	}
	return out.Success
}
