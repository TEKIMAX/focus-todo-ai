# Focus Todo AI

An AI-powered todo application built with Next.js that automatically organizes your tasks based on priority, complexity, and available time. Features an integrated Pomodoro timer for focused work sessions.

## ✨ Features

- 🤖 **AI-Powered Organization**: Automatically prioritizes and organizes tasks using OpenAI
- ⏱️ **Smart Time Allocation**: AI analyzes task complexity and allocates optimal time
- 🎯 **Focus Timer**: Built-in Pomodoro timer with work/break cycles
- 📋 **Sortable Interface**: Drag-and-drop task management with beautiful animations
- 🎨 **Modern UI**: Built with Framer Motion and Tailwind CSS
- 📊 **Priority Management**: Visual priority indicators (urgent, high, medium, low)
- 🔧 **Complexity Assessment**: Simple, moderate, or complex task categorization
- 🧠 **Multiple Focus Modes**: Balanced, urgent-first, deadline-priority, or complexity-based

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- OpenAI API key
- Bun (recommended) or npm/yarn

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd focus-todo-ai
bun install
```

2. **Set up environment variables:**
Create a `.env.local` file in the root directory:
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

3. **Run the development server:**
```bash
bun dev
```

4. **Open your browser:**
Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 How It Works

### AI Organization
The app uses OpenAI's GPT-4 to analyze your todos and:
- **Prioritize** tasks based on urgency and importance
- **Estimate** realistic time requirements
- **Organize** the optimal order for maximum productivity
- **Allocate** time efficiently within your available schedule

### Focus Modes
- **Balanced**: Mix of high-priority tasks and quick wins
- **Urgent First**: Prioritizes urgent and high-priority items
- **Deadline Priority**: Orders by deadline proximity
- **Simple First**: Starts with easier tasks for momentum

### Focus Timer
- Pomodoro technique integration
- Automatic work/break cycles
- Visual progress tracking
- Session completion notifications

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **AI**: OpenAI GPT-4 via AI SDK
- **UI**: Framer Motion + Tailwind CSS
- **Components**: Radix UI primitives
- **Icons**: Lucide React
- **Notifications**: Sonner

## 📁 Project Structure

```
focus-todo-ai/
├── app/
│   ├── api/organize-todos/   # AI organization endpoint
│   ├── layout.tsx           # Root layout
│   └── page.tsx            # Main application
├── components/
│   ├── ui/                 # Reusable UI components
│   ├── focus-timer.tsx     # Pomodoro timer component
│   └── focus-todo-app.tsx  # Main app component
├── lib/
│   ├── types.ts           # TypeScript interfaces
│   └── utils.ts           # Utility functions
└── README.md
```

## 🎮 Usage

1. **Add Tasks**: Click "Add Task" to create new todos
2. **Configure Details**: Set priority, complexity, and time estimates
3. **AI Organization**: Click "AI Organize" to let AI optimize your task order
4. **Focus Sessions**: Start a focus timer for any task
5. **Track Progress**: Monitor completion and time spent

## ⚙️ API Endpoints

### POST `/api/organize-todos`
Organizes todos using AI based on:
- Current tasks and their properties
- Available time
- Selected focus mode

Returns optimized task order with time allocations and reasoning.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [AI SDK by Vercel](https://ai-sdk.dev/) for seamless OpenAI integration
- [Cult UI](https://www.cult-ui.com/) for the sortable list component inspiration
- OpenAI for providing the GPT-4 model
