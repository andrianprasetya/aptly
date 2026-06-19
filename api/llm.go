package main

import (
	"context"
	"errors"
	"os"

	openai "github.com/sashabaranov/go-openai"
)

const (
	defaultModel    = "gpt-4o-mini"
	maxOutputTokens = 1500 // caps per-call output cost
)

// LLM is the small interface the service depends on, so the OpenAI client is
// swappable (e.g. for Claude) and stubbable in tests.
type LLM interface {
	Complete(ctx context.Context, system, user string) (string, error)
}

// OpenAIClient implements LLM against the OpenAI chat API in JSON mode.
type OpenAIClient struct {
	client *openai.Client
	model  string
}

func NewOpenAIClient() *OpenAIClient {
	model := os.Getenv("OPENAI_MODEL")
	if model == "" {
		model = defaultModel
	}
	return &OpenAIClient{
		client: openai.NewClient(os.Getenv("OPENAI_API_KEY")),
		model:  model,
	}
}

func (o *OpenAIClient) Complete(ctx context.Context, system, user string) (string, error) {
	resp, err := o.client.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
		Model:       o.model,
		MaxTokens:   maxOutputTokens,
		Temperature: 0.4,
		ResponseFormat: &openai.ChatCompletionResponseFormat{
			Type: openai.ChatCompletionResponseFormatTypeJSONObject,
		},
		Messages: []openai.ChatCompletionMessage{
			{Role: openai.ChatMessageRoleSystem, Content: system},
			{Role: openai.ChatMessageRoleUser, Content: user},
		},
	})
	if err != nil {
		return "", err
	}
	if len(resp.Choices) == 0 {
		return "", errors.New("openai: empty response")
	}
	return resp.Choices[0].Message.Content, nil
}
