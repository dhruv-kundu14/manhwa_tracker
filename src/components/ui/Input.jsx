import React from 'react'
import { forwardRef } from 'react'

/**
 * Thin wrapper around <input> that applies global input styles.
 * Passes all props + ref through so it works seamlessly with react-hook-form.
 */
const Input = forwardRef(function Input({ label, error, className = '', ...props }, ref) {
  return (
    <div className="field">
      {label && <label className="field-label">{label}</label>}
      <input
        ref={ref}
        className={`field-input ${error ? 'field-input--error' : ''} ${className}`}
        {...props}
      />
      {error && <span className="field-error">{error}</span>}
    </div>
  )
})

export default Input
