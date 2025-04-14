import { FrownOutlined } from '@ant-design/icons'
import { Result } from 'antd'
import React from 'react'

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo | string
}

class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  constructor(props: React.PropsWithChildren) {
    super(props)
    this.state = {
      hasError: false,
      error: undefined,
      errorInfo: undefined,
    }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Component Error:', error, errorInfo)
    this.setState({ errorInfo })
  }

  componentDidMount() {
    // 捕获全局未处理错误
    window.addEventListener('error', this.handleWindowError)
    // 捕获未处理 Promise 拒绝
    window.addEventListener('unhandledrejection', this.handlePromiseRejection)
  }

  componentWillUnmount() {
    window.removeEventListener('error', this.handleWindowError)
    window.removeEventListener('unhandledrejection', this.handlePromiseRejection)
  }

  handleWindowError = (event: ErrorEvent) => {
    console.error('Global Error:', event.error || event.message)
    this.setState({
      hasError: true,
      error: event.error || new Error(event.message),
      errorInfo: event.filename + ':' + event.lineno,
    })
  }

  handlePromiseRejection = (event: PromiseRejectionEvent) => {
    console.error('Unhandled Promise Rejection:', event.reason)
    this.setState({
      hasError: true,
      error: event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      errorInfo: 'Unhandled Promise rejection',
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <Result
          style={{ marginTop: '30px' }}
          status="error"
          title="Oops! Something went wrong."
          subTitle={this.state.error?.message || 'An unexpected error occurred.'}
          icon={<FrownOutlined />}
          extra={
            <pre
              style={{
                textAlign: 'left',
                whiteSpace: 'pre-wrap',
                background: '#f5f5f5',
                padding: 12,
                borderRadius: 4,
                maxHeight: 300,
                overflow: 'auto',
              }}
            >
              {typeof this.state.errorInfo === 'string' ? this.state.errorInfo : this.state.errorInfo?.componentStack}
            </pre>
          }
        />
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
