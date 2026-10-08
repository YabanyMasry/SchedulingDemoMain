import { forwardRef } from 'react'

const CircleIconButton = forwardRef(function CircleIconButton(
  {
    icon,
    className = '',
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={`icon-button rm-circle-button ${className}`.trim()}
      {...props}
    >
      {icon}
    </button>
  )
})

export default CircleIconButton
