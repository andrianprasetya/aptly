package main

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
)

// analyzeHandler is the HTTP layer: parse, delegate to the service, map errors.
func analyzeHandler(svc *Analyzer) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req AnalyzeRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid JSON body"})
			return
		}

		result, err := svc.Analyze(c.Request.Context(), req)
		if err != nil {
			switch {
			case errors.Is(err, ErrInvalidInput):
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			case errors.Is(err, ErrInputTooLarge):
				c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": err.Error()})
			case errors.Is(err, ErrBadLLMOutput):
				c.JSON(http.StatusBadGateway, gin.H{"error": "model returned malformed output, please retry"})
			default:
				// Upstream LLM call failed (network, auth, rate limit, etc.).
				c.JSON(http.StatusBadGateway, gin.H{"error": "analysis failed, please try again"})
			}
			return
		}

		c.JSON(http.StatusOK, result)
	}
}
