# Only needed if deploying to Fly.io. Render can build native Go without this.
FROM golang:1.22 AS build
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
