package main

import (
	"errors"
	"fmt"
	"strings"
)

// AnalyzeRequest is the JSON body for POST /api/analyze.
type AnalyzeRequest struct {
	CVText string `json:"cvText"`
	JDText string `json:"jdText"`
}

// AnalysisResult is the grounded analysis returned to the frontend. The JSON
// tags are the contract the model must produce and the UI consumes.
type AnalysisResult struct {
	// MatchScore is a rough CV↔JD overlap signal (0-100), NOT a real ATS score.
	MatchScore      int      `json:"matchScore"`
	Summary         string   `json:"summary"`
	MatchedSkills   []string `json:"matchedSkills"`
	MissingSkills   []string `json:"missingSkills"`
	MissingKeywords []string `json:"missingKeywords"`
	Suggestions     []string `json:"suggestions"`
	CoverLetter     string   `json:"coverLetter"`
}

// validate checks the model output is structurally sane and normalizes nil
// slices to empty ones so the frontend always gets stable arrays.
func (r *AnalysisResult) validate() error {
	if r.MatchScore < 0 || r.MatchScore > 100 {
		return fmt.Errorf("matchScore out of range: %d", r.MatchScore)
	}
	if strings.TrimSpace(r.Summary) == "" {
		return errors.New("summary is empty")
	}
	if strings.TrimSpace(r.CoverLetter) == "" {
		return errors.New("coverLetter is empty")
	}
	if r.MatchedSkills == nil {
		r.MatchedSkills = []string{}
	}
	if r.MissingSkills == nil {
		r.MissingSkills = []string{}
	}
	if r.MissingKeywords == nil {
		r.MissingKeywords = []string{}
	}
	if r.Suggestions == nil {
		r.Suggestions = []string{}
	}
	return nil
}
