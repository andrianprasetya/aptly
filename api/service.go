package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"unicode/utf8"
)

// maxInputChars rejects oversized CV/JD before spending an OpenAI call.
// Generous enough for an uploaded multi-page CV, still bounded for cost.
const maxInputChars = 50000

var (
	ErrInvalidInput  = errors.New("cvText and jdText are required")
	ErrInputTooLarge = fmt.Errorf("cvText and jdText must each be under %d characters", maxInputChars)
	ErrBadLLMOutput  = errors.New("model returned malformed output")
)

// Analyzer holds the business logic: it owns grounding + validation and depends
// only on the small LLM interface.
type Analyzer struct {
	llm LLM
}

func NewAnalyzer(llm LLM) *Analyzer {
	return &Analyzer{llm: llm}
}

// Analyze validates input, calls the LLM with the grounding prompt, then parses
// and validates the JSON. Returns sentinel errors the handler maps to status codes.
func (a *Analyzer) Analyze(ctx context.Context, req AnalyzeRequest) (*AnalysisResult, error) {
	cv := strings.TrimSpace(req.CVText)
	jd := strings.TrimSpace(req.JDText)
	if cv == "" || jd == "" {
		return nil, ErrInvalidInput
	}
	if utf8.RuneCountInString(cv) > maxInputChars || utf8.RuneCountInString(jd) > maxInputChars {
		return nil, ErrInputTooLarge
	}

	raw, err := a.llm.Complete(ctx, systemPrompt, buildUserPrompt(cv, jd))
	if err != nil {
		return nil, fmt.Errorf("llm call failed: %w", err)
	}

	var result AnalysisResult
	if err := json.Unmarshal([]byte(raw), &result); err != nil {
		return nil, fmt.Errorf("%w: %v", ErrBadLLMOutput, err)
	}
	if err := result.validate(); err != nil {
		return nil, fmt.Errorf("%w: %v", ErrBadLLMOutput, err)
	}
	return &result, nil
}
