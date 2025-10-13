# Git environment
export BRANCH = $(shell git rev-parse --abbrev-ref HEAD)
export GITSHA = $(shell git rev-parse HEAD)

# Use bash-specific features
SHELL := /bin/bash

# No extra submake output
make = make --no-print-directory

# Find all TypeScript source files
SOURCES = $(shell find src tests -name \*.ts)

# Deno commands

.PHONY: check format run repl test clean

check:
	@deno check $(SOURCES)

format:
	@deno fmt

run: ARGS =
run:
	@deno run --allow-read --allow-write src/main.ts $(ARGS)

repl:
	@deno run --allow-read --allow-write src/repl/repl.ts

test: ARGS =
test:
	@deno test --allow-read --allow-write --allow-net tests/*.test.ts $(ARGS)

clean:
	@find . -name ".DS_Store" -delete

help:
	@echo "Axiom Language Makefile"
	@echo ""
	@echo "Available targets:"
	@echo "  make check     - Type check all TypeScript files"
	@echo "  make test      - Run all tests"
	@echo "  make format    - Format code with deno fmt"
	@echo "  make run       - Run a file (use ARGS=filename.ax)"
	@echo "  make repl      - Start interactive REPL"
	@echo "  make clean     - Clean temporary files"
	@echo ""
	@echo "Examples:"
	@echo "  make check"
	@echo "  make test"
	@echo "  make run ARGS=examples/hello-world.ax"

