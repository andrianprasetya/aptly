# Container build for the Go API (used by Fly.io and DigitalOcean App Platform).
# Must be >= the go directive in go.mod (currently 1.25).
FROM golang:1.25 AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /app .

FROM gcr.io/distroless/base-debian12
COPY --from=build /app /app
ENV PORT=8080
EXPOSE 8080
CMD ["/app"]
