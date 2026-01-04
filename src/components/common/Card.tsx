import type { ReactNode } from 'react'

export function Card(props: {
  title?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`card ${props.className ?? ''}`}>
      {props.title ? <div className="cardTitle">{props.title}</div> : null}
      <div className="cardBody">{props.children}</div>
    </section>
  )
}

