import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Area, AreaChart, ResponsiveContainer } from "recharts"
import { PublishedStrategy } from "@/stores/copytradestote"
import { useAuthStore } from "@/stores/authstore"

interface TradingCardProps {
  id: string
  subtitle: string
  name: string
  symbol: string
  percentage: number
  totalPnl: number
  aumValues: number[]
  chartData: { value: number }[]
  strategy: PublishedStrategy
}

export function TradingCard({
  id,
  subtitle,
  name,
  symbol,
  percentage,
  chartData,
  strategy,
}: TradingCardProps) {
  // Get current user from auth store
  const { user } = useAuthStore()
  
  // Extract strategy details
  const maxCapital = strategy.config?.capital?.maxCapital || 0
  const perOrderAmount = strategy.config?.capital?.perOrderAmount || 0
  const followers = strategy._count?.copyFollowers || 0
  const stopLossEnabled = strategy.config?.risk?.stopLoss?.enabled || false
  const stopLossPercentage = strategy.config?.risk?.stopLoss?.percentage || 0

  // ✅ Check if current user is the owner of this strategy
  const isOwner = user?.id === strategy.userId

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card className="w-[280px] flex-shrink-0 border-2 border-[#581C3D] dark:border-gray-700 rounded-xl p-4 bg-card dark:bg-[#232326] shadow-lg text-foreground dark:text-white transition-colors duration-300 hover:shadow-xl hover:border-[#6a1f47] cursor-pointer">
      <div className="space-y-4">
        {/* Header with Avatar and Strategy Name */}
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-gradient-to-br from-[#581C3D] to-[#8B2E5C] text-white text-sm font-semibold">
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{subtitle}</div>
            <div className="text-sm font-semibold truncate text-gray-900 dark:text-white mt-0.5">{name}</div>
            <div className="text-xs text-gray-600 dark:text-gray-300 font-medium mt-0.5">{symbol}</div>
          </div>
        </div>

        {/* ROI Display */}
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-green-500">
            +{percentage.toFixed(2)}%
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Take Profit
          </div>
        </div>

        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-300 px-1">
          <span>Performance</span>
          <span>30D</span>
        </div>
        
        {/* Chart */}
        <div className="h-20 -mx-1 bg-white dark:bg-[#232326] rounded-md">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={`colorValue-${id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke="#22c55e"
                fill={`url(#colorValue-${id})`}
                strokeWidth={1.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Strategy Details */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Max Capital</span>
            <span className="font-semibold">${maxCapital.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Per Order</span>
            <span className="font-semibold">${perOrderAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Followers</span>
            <span className="font-semibold">{followers}</span>
          </div>
        </div>

        {/* Footer with Stats and Copy Button */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-300">
            <div className="flex items-center gap-1">
              <div className="flex -space-x-1">
                <div className="w-2 h-2 rounded-full bg-pink-200 dark:bg-pink-400"></div>
                <div className="w-2 h-2 rounded-full bg-pink-300 dark:bg-pink-500"></div>
                <div className="w-2 h-2 rounded-full bg-pink-400 dark:bg-pink-600"></div>
              </div>
              <span className="ml-1 text-xs font-medium">{followers}</span>
            </div>
            <div className="flex items-center gap-3">
              {/* Status Indicator */}
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${
                  strategy.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-400'
                }`}></div>
                <span className="text-xs">{strategy.status}</span>
              </div>
              {/* Stop Loss Indicator */}
              <div className="flex items-center gap-1" title={stopLossEnabled ? `Stop Loss: ${stopLossPercentage}%` : 'No Stop Loss'}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={stopLossEnabled ? 'text-red-500' : 'text-gray-400'}>
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
                <span>{stopLossEnabled ? `${stopLossPercentage}%` : 'N/A'}</span>
              </div>
            </div>
          </div>
          <div className="flex justify-center">
            {/* ✅ Show "Active" for owner, "Copy Strategy" for others */}
            <button 
              className={`px-12 py-2 rounded-md transition-colors w-full font-medium ${
                isOwner 
                  ? 'bg-green-600 text-white cursor-default' 
                  : 'bg-[#581C3D] text-white hover:bg-[#581C3D]/90 cursor-pointer'
              }`}
              disabled={isOwner}
            >
              {isOwner ? 'Active' : 'Copy Strategy'}
            </button>
          </div>
        </div>
      </div>
    </Card>
  )
}