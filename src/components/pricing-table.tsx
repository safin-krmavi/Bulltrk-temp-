'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check, Minus, Plus } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authstore'
import { toast } from 'sonner'

export default function Component() {
  const [selectedTab, setSelectedTab] = useState('trader')
  const [billingCycle, setBillingCycle] = useState('monthly')
  const navigate = useNavigate()
  const { isAuthenticated, setHasSelectedPlan } = useAuthStore()

  const strategies = [
    'API Connect per Exchange',
    'Strategy 1',
    'Strategy 2',
    'Strategy 3',
    'Strategy 4',
    'Strategy 5',
    'Strategy 6',
    'Strategy 7',
    'Strategy 8',
    'Backtesting'
  ]

  const handlePlanSelection = (planName: string) => {
    if (!isAuthenticated) {
      toast.error("Please login first", {
        description: "You need to be logged in to select a plan"
      })
      navigate('/login')
      return
    }

    // Show success message
    toast.success(`${planName} plan selected!`, {
      description: "Redirecting to dashboard..."
    })

    // Mark that user has selected a plan
    setHasSelectedPlan(true)

    // Redirect to dashboard after a short delay
    setTimeout(() => {
      navigate('/dashboard')
    }, 1000)
  }

  const renderContent = () => {
    if (selectedTab === 'market-place' || selectedTab === 'affiliate') {
      return (
        <Card className="bg-[#5D1725] text-white w-full max-w-xs mx-auto">
          <CardHeader>
            <CardTitle className="text-xl text-center">Seller</CardTitle>
            <div className="text-3xl font-bold text-center">₹ 1400/-</div>
            <Button 
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => handlePlanSelection('Seller')}
            >
              Register
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Check className="h-5 w-5 text-orange-500" />
                <span>Feature {i + 1}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="grid md:grid-cols-4 gap-6 w-full">
        {["Basic", "Advance", "Professional", "Customize"].map((tier) => (
          <Card key={tier} className="bg-[#5D1725] text-white">
            <CardHeader>
              <CardTitle className="text-xl text-center">{tier}</CardTitle>
              <div className="text-3xl font-bold text-center">
                ₹ {billingCycle === 'monthly' ? '1400' : '14000'}/-
              </div>
              <Button 
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                onClick={() => handlePlanSelection(tier)}
              >
                {isAuthenticated ? 'Select Plan' : 'Register'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {strategies.map((_, i) => (
                <div key={i} className="flex items-center justify-between max-w-xs w-full">
                  {i < 6 ? (
                    <>
                      {tier === "Customize"  ? (
                        <div className="flex justify-center items-center gap-2 border w-full rounded-full px-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-white">
                            <Plus className="h-4 w-4" />
                          </Button>
                          <span>0</span>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-white">
                            <Minus className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <span>10 Strategy Bots</span>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-center w-full gap-2">
                      <Check className="h-5 w-5 text-orange-500" />
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">Our Pricing</h1>
      
      <div className="flex justify-center gap-4 mb-8">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full max-w-2xl">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="trader" className="data-[state=active]:bg-[#5D1725] data-[state=active]:text-white">
              Trader
            </TabsTrigger>
            <TabsTrigger value="copy-trade" className="data-[state=active]:bg-[#5D1725] data-[state=active]:text-white">
              Copy Trade
            </TabsTrigger>
            <TabsTrigger value="market-place" className="data-[state=active]:bg-[#5D1725] data-[state=active]:text-white">
              Market Place
            </TabsTrigger>
            <TabsTrigger value="affiliate" className="data-[state=active]:bg-[#5D1725] data-[state=active]:text-white">
              Affiliate
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

     <div className="flex gap-10">
       <div className="flex flex-col gap-4">
        <div className="flex justify-center mb-8 mt-10">
            <Tabs value={billingCycle} onValueChange={setBillingCycle} className="w-48">
            <TabsList className="grid w-full grid-cols-2 bg-[#5D1725] ">
                <TabsTrigger value="monthly" className="data-[state=active]:bg-white data-[state=active]:text-black text-white">Monthly</TabsTrigger>
                <TabsTrigger value="yearly" className="data-[state=active]:bg-white data-[state=active]:text-black text-white">Yearly</TabsTrigger>
            </TabsList>
            </Tabs>
        </div>

        {
            strategies.map((strategy, i) => (
                <div key={i} className="flex items-center gap-2 w-full pb-2 border-b">
                    <span className="text-ellipsis text-[14px] font-semibold">{strategy}</span>
                </div>
            ))
        }
       </div>

      {renderContent()}
     </div>
    </div>
  )
}