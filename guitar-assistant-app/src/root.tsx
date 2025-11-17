import './index.css'
import App from './App.tsx'

export function Root(props: { url: URL }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <link rel="icon" type="image/svg+xml" href="/vite.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Guitar Assistant</title>
      </head>
      <body>
        <App />
      </body>
    </html>
  )
}
