package main

import (
	"context"
	"errors"
	"testing"
)

// stubLLM lets us exercise the service without a real OpenAI call.
type stubLLM struct {
	out string
	err error
}

func (s stubLLM) Complete(ctx context.Context, system, user string) (string, error) {
	return s.out, s.err
}

const goodJSON = `{
  "matchScore": 72,
  "summary": "Solid backend overlap, lighter on the cloud requirements.",
  "matchedSkills": ["Go", "PostgreSQL"],
  "missingSkills": ["Kubernetes"],
  "missingKeywords": ["CI/CD"],
  "suggestions": ["Surface your Docker work", "Add the AWS project"],
  "coverLetter": "Dear hiring team, I am excited to apply..."
}`

func TestAnalyze_Valid(t *testing.T) {
	svc := NewAnalyzer(stubLLM{out: goodJSON})
	res, err := svc.Analyze(context.Background(), AnalyzeRequest{CVText: "Go dev", JDText: "Need Go"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if res.MatchScore != 72 {
		t.Errorf("matchScore = %d, want 72", res.MatchScore)
	}
	if len(res.MatchedSkills) != 2 {
		t.Errorf("matchedSkills = %v, want 2", res.MatchedSkills)
	}
}

func TestAnalyze_EmptyInput(t *testing.T) {
	svc := NewAnalyzer(stubLLM{out: goodJSON})
	_, err := svc.Analyze(context.Background(), AnalyzeRequest{CVText: "  ", JDText: "Need Go"})
	if !errors.Is(err, ErrInvalidInput) {
		t.Fatalf("err = %v, want ErrInvalidInput", err)
	}
}

func TestAnalyze_MalformedJSON(t *testing.T) {
	svc := NewAnalyzer(stubLLM{out: "not json at all"})
	_, err := svc.Analyze(context.Background(), AnalyzeRequest{CVText: "x", JDText: "y"})
	if !errors.Is(err, ErrBadLLMOutput) {
		t.Fatalf("err = %v, want ErrBadLLMOutput", err)
	}
}

func TestAnalyze_ScoreOutOfRange(t *testing.T) {
	svc := NewAnalyzer(stubLLM{out: `{"matchScore":150,"summary":"x","coverLetter":"y"}`})
	_, err := svc.Analyze(context.Background(), AnalyzeRequest{CVText: "x", JDText: "y"})
	if !errors.Is(err, ErrBadLLMOutput) {
		t.Fatalf("err = %v, want ErrBadLLMOutput (score out of range)", err)
	}
}

func TestAnalyze_LLMError(t *testing.T) {
	svc := NewAnalyzer(stubLLM{err: errors.New("network down")})
	_, err := svc.Analyze(context.Background(), AnalyzeRequest{CVText: "x", JDText: "y"})
	if err == nil || errors.Is(err, ErrBadLLMOutput) {
		t.Fatalf("err = %v, want a non-ErrBadLLMOutput llm error", err)
	}
}
