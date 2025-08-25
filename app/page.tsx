import { EnhancedFocusTodoApp } from "@/components/enhanced-focus-todo-app"
import { Toaster } from "sonner"

export default function Home() {
  return (
    <>
      <main className="min-h-screen bg-black">
        <EnhancedFocusTodoApp />
      </main>
      <Toaster
        theme="dark"
        position="top-right"
        toastOptions={{
          style: {
            background: '#262626',
            border: '1px solid #404040',
            color: '#ffffff',
          },
        }}
      />
    </>
  )
}
