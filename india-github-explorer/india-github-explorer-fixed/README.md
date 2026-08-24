# India GitHub Explorer — Rate Limit Safe Version

> A beginner-friendly developer discovery tool for exploring public repositories from GitHub users who list India as their location.

## What is improved

This version was designed to reduce unnecessary GitHub API requests.

### 1. Browser caching

Search results are stored in `localStorage` for 10 minutes.

```text
First search
   ↓
GitHub API
   ↓
Save result in browser

Same search again
   ↓
Use cached result
   ↓
No new API request
```

### 2. Fewer requests

The app searches up to 5 users and loads up to 8 repositories per user instead of requesting a large number of users and repositories.

### 3. Rate-limit handling

If GitHub returns HTTP 403 or 429, the UI shows a clear rate-limit message instead of a generic error.

### 4. Profile caching

Developer profiles are cached too, so repeatedly opening the same profile does not create another API request for 10 minutes.

## Features

- 🇮🇳 India-based developer discovery
- Search by technology or keyword
- Language filter
- Minimum-star filter
- Sort by stars, recently updated, or name
- Developer profile
- Favorite repositories
- LocalStorage favorites
- Search-result caching
- Profile caching
- Clear-cache button
- GitHub API rate-limit handling
- Responsive design

## Important technical note

GitHub does not have an official country field for repositories. This project uses the public location listed on a GitHub user's profile. Therefore it should be described as:

**Repositories from GitHub users who list India as their location.**

It is not a guaranteed list of every repository created by an Indian developer.

## APIs used

### User search

```text
GET https://api.github.com/search/users?q=python+location:India
```

### User repositories

```text
GET https://api.github.com/users/USERNAME/repos
```

### Developer profile

```text
GET https://api.github.com/users/USERNAME
```

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- GitHub REST API
- Fetch API
- JSON
- LocalStorage
- Git & GitHub

## Project structure

```text
india-github-explorer-fixed/
├── index.html
├── style.css
├── script.js
└── README.md
```

## Run locally

1. Open the folder in VS Code.
2. Open `index.html` with Live Server.
3. Search for `python`, `javascript`, `react`, or `data science`.

## Interview explanation

> I built a GitHub developer discovery tool focused on users who list India as their location. The app searches GitHub users, retrieves their public repositories, and displays repository metrics. I implemented client-side filtering, sorting, favorites, profile lookup and LocalStorage caching. I also added API rate-limit handling to reduce unnecessary requests and provide a useful message when GitHub rejects requests.

## Main JavaScript concepts

### Fetch API

Used to send GET requests to GitHub.

### async/await

Used to handle asynchronous API responses in readable JavaScript.

### Promise.all

Used to request several users' repositories in parallel.

### LocalStorage

Used for:

- API result caching
- Favorite repositories
- Avoiding repeated requests

### Error handling

`try/catch` and HTTP status checks handle failed API requests and rate limits.

## Current API limitation

Unauthenticated GitHub API access has rate limits. Caching reduces requests, but it cannot remove GitHub's limit completely.

A production application could use a backend server with secure authentication and additional caching.

## Author

**Anshuman Sahu**

Portfolio project for practicing REST APIs, JavaScript, GitHub API integration and developer-focused UX.
