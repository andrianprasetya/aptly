package main

import (
	"net/http"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	// CORS: allow only the deployed frontend origin (set via ALLOWED_ORIGIN).
	// Falls back to localhost:3000 for local dev.
	r.Use(cors.New(cors.Config{
		AllowOrigins: allowedOrigins(),
		AllowMethods: []string{http.MethodGet, http.MethodPost, http.MethodOptions},
		AllowHeaders: []string{"Content-Type"},
	}))

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	// Wire the analyzer: OpenAI client -> service -> HTTP handler.
	analyzer := NewAnalyzer(NewOpenAIClient())
	r.POST("/api/analyze", analyzeHandler(analyzer))

	if err := r.Run(":" + port()); err != nil {
		panic(err)
	}
}

// allowedOrigins returns the CORS allow-list. In production set ALLOWED_ORIGIN
// to the Vercel URL; locally we default to the Next.js dev server.
func allowedOrigins() []string {
	if o := os.Getenv("ALLOWED_ORIGIN"); o != "" {
		return []string{o}
	}
	return []string{"http://localhost:3000"}
}

// port returns the port to listen on. Render/Fly inject PORT; default 8080.
func port() string {
	if p := os.Getenv("PORT"); p != "" {
		return p
	}
	return "8080"
}
