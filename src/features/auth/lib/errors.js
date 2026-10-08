export const getAuthErrorMessage = (error, fallbackMessage) => {
  const statusCode = error?.response?.status

  if (statusCode === 429) {
    // Read the Retry-After header for a precise wait time if the server provides one
    const retryAfter = error?.response?.headers?.['retry-after']
    if (retryAfter) {
      return `Too many attempts. Try again in ${retryAfter} seconds.`
    }
    return 'Too many attempts. Please wait and try again.'
  }

  if (statusCode === 422) {
    // Extract the first validation message from the errors map returned by FluentValidation
    const fieldErrors = error?.response?.data?.errors
    if (fieldErrors && typeof fieldErrors === 'object') {
      const firstKey = Object.keys(fieldErrors)[0]
      const firstMessages = firstKey ? fieldErrors[firstKey] : null
      if (Array.isArray(firstMessages) && firstMessages.length > 0) {
        return firstMessages[0]
      }
    }
  }

  if (statusCode === 401) {
    // The magic link token is the credential on the verify endpoint, so 401 means the token is bad or expired
    return 'This link is invalid or expired. Request a new magic link.'
  }

  if (error?.response?.data?.error) {
    return error.response.data.error
  }

  return fallbackMessage
}
