# Contributing to HRM System

Thank you for considering contributing to our HRM System! We appreciate your time and effort in helping us improve this project.

## 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** to your local machine
   ```bash
   git clone https://github.com/your-username/hrm.git
   cd hrm
   ```
3. **Set up the development environment** (see [README.md](README.md))
4. **Create a feature branch** for your changes
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 🛠 Development Workflow

1. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

2. **Run the development servers**
   ```bash
   # In one terminal (backend)
   cd backend
   npm run dev
   
   # In another terminal (frontend)
   cd frontend
   npm run dev
   ```

3. **Run tests**
   ```bash
   # Backend tests
   cd backend
   npm test
   
   # Frontend tests
   cd ../frontend
   npm test
   ```

## 📝 Pull Request Process

1. Ensure your code passes all tests
2. Update documentation as needed
3. Run linters and fix any issues
   ```bash
   # Backend
   cd backend
   npm run lint
   npm run format
   
   # Frontend
   cd ../frontend
   npm run lint
   npm run format
   ```
4. Commit your changes with a descriptive message
   ```bash
   git commit -m "feat: add new feature"
   ```
5. Push to your fork and submit a pull request

## 📋 Code Style

- **Backend**: Follow [Node.js best practices](https://github.com/goldbergyoni/nodebestpractices)
- **Frontend**: Follow [React best practices](https://reactjs.org/docs/faq-structure.html)
- **Git**: Use [Conventional Commits](https://www.conventionalcommits.org/)
- **Formatting**: Prettier is used for code formatting

## 🐛 Reporting Issues

When reporting issues, please include:
- A clear title and description
- Steps to reproduce the issue
- Expected vs actual behavior
- Screenshots if applicable
- Browser/OS version if frontend related

## 📜 License

By contributing, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
