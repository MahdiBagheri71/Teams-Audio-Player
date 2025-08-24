# Contributing to Teams Audio Player

First off, thank you for considering contributing to Teams Audio Player! It's people like you that make Teams Audio Player such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples to demonstrate the steps**
- **Describe the behavior you observed after following the steps**
- **Explain which behavior you expected to see instead and why**
- **Include screenshots and animated GIFs if possible**
- **Include your environment details** (OS, browser, Node.js version)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Use a clear and descriptive title**
- **Provide a step-by-step description of the suggested enhancement**
- **Provide specific examples to demonstrate the steps**
- **Describe the current behavior and explain which behavior you expected**
- **Explain why this enhancement would be useful**

### Pull Requests

1. **Fork the repo and create your branch from `main`**:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Ensure your code follows the project's coding standards**:

   ```bash
   npm run lint
   npm run format
   ```

3. **Write meaningful commit messages**:

   - Use the present tense ("Add feature" not "Added feature")
   - Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
   - Limit the first line to 72 characters or less

4. **Make sure your code passes all tests**:

   ```bash
   npm test
   ```

5. **Update documentation** if you're changing functionality

6. **Submit your pull request**

## Development Setup

1. **Prerequisites**:

   - Node.js >= 16.x
   - npm or yarn
   - Git

2. **Setup**:

   ```bash
   # Clone your fork
   git clone https://github.com/your-username/teams-audio-player.git
   cd teams-audio-player

   # Install dependencies
   npm install

   # Create .env file with your Azure AD credentials
   cp .env.example .env
   # Edit .env with your values

   # Start development server
   npm start
   ```

## Coding Standards

### JavaScript/React

- Use ES6+ features
- Follow React best practices and hooks guidelines
- Keep components small and focused
- Use meaningful variable and function names
- Add JSDoc comments for complex functions

### CSS

- Use CSS modules or styled-components for component styling
- Follow BEM naming convention for class names
- Ensure responsive design
- Test on multiple browsers

### File Organization

```
src/
├── components/     # React components
├── hooks/         # Custom hooks
├── services/      # API services
├── utils/         # Utility functions
└── styles/        # Global styles
```

### Testing

- Write unit tests for new features
- Ensure existing tests pass
- Aim for >80% code coverage
- Test edge cases

## Git Workflow

1. **Feature Development**:

   ```bash
   git checkout -b feature/new-feature
   # Make changes
   git add .
   git commit -m "Add new feature"
   git push origin feature/new-feature
   ```

2. **Bug Fixes**:
   ```bash
   git checkout -b fix/bug-description
   # Fix bug
   git add .
   git commit -m "Fix: bug description"
   git push origin fix/bug-description
   ```

## Review Process

1. All submissions require review
2. Changes may be requested before merging
3. Be patient and respectful during the review process
4. Address all feedback constructively

## Release Process

1. Releases follow semantic versioning (MAJOR.MINOR.PATCH)
2. Changelog is updated with each release
3. Releases are tagged in Git
4. Docker images are built and pushed for each release

## Questions?

Feel free to open an issue with your question or contact the maintainers directly.

Thank you for contributing! 🎉
