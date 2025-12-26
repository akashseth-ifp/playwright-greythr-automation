# Playwright Automation

This repository contains a set of Playwright automation that does the following:

1. Authenticate to Greythr using provided credentials
2. Find the reporting manager of a given employee
3. Calculate the total leave balance of the loggedIn employee

## Prerequisites

Node.js (version 16 or higher)
Playwright (version 1.36 or higher)

## Installation

Clone the repository:

```git clone https://github.com/akashseth-ifp/playwright-greythr-automation.git```

```cd playwright-greythr-automation```

Install dependencies:

```pnpm install```

Add a .env file with the following environment variables:

```
LOGIN_ID=
PASSWORD=
EMPLOYEE_NAME=
```

## Running Tests

```pnpm test```

### Result

You will see a `result.txt` file in the root directory.