package main

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func turnstileRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.POST("/x", turnstileMiddleware(), func(c *gin.Context) { c.Status(http.StatusOK) })
	return r
}

// With no TURNSTILE_SECRET set, the middleware is a no-op (local dev / build).
func TestTurnstile_DisabledWithoutSecret(t *testing.T) {
	t.Setenv("TURNSTILE_SECRET", "")
	r := turnstileRouter()
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/x", nil)
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("no secret: got %d, want 200 (no-op)", w.Code)
	}
}

// With a secret set but no token, requests are rejected before any network call.
func TestTurnstile_RejectsMissingToken(t *testing.T) {
	t.Setenv("TURNSTILE_SECRET", "dummy-secret")
	r := turnstileRouter()
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/x", nil)
	r.ServeHTTP(w, req)
	if w.Code != http.StatusForbidden {
		t.Fatalf("secret set, no token: got %d, want 403", w.Code)
	}
}
