"use client"

import React from "react"

type Props = {
  children: React.ReactNode
}

type State = {
  hasError: boolean
  error?: Error
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // فقط لاگ خطاهایی که مربوط به Supabase نیستن
    if (
      !(
        error.message.includes("supabase.co/auth/v1/token") ||
        error.message.includes("400")
      )
    ) {
      console.error("ErrorBoundary caught an error:", error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-100 text-red-600 rounded">
          خطایی رخ داده. لطفاً صفحه را دوباره بارگذاری کنید.
        </div>
      )
    }
    return this.props.children
  }
}
