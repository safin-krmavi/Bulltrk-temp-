import Footer from '@/components/footer'
import Header from '@/components/header'
import { ReactNode, useState, useEffect } from 'react'

const GenericLayout = ({children}:{children:ReactNode}) => {
  const [hasBanner, setHasBanner] = useState(false)

  // Check if promotional banner is visible
  useEffect(() => {
    const checkBanner = () => {
      const banner = document.querySelector('[data-promotional-banner]')
      setHasBanner(!!banner)
    }

    // Check initially
    checkBanner()

    // Set up observer to watch for banner changes
    const observer = new MutationObserver(checkBanner)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [])

  return (
    <main className={`flex flex-col w-full min-h-screen h-full bg-[#F8F8F8] dark:bg-[#18181b] text-foreground transition-colors duration-300 ${hasBanner ? 'pt-16' : ''}`}>
      <Header />
      <div className="flex w-full flex-grow items-start">
        {children}
      </div>
      <Footer />
    </main>
  )
}

export default GenericLayout