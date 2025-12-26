'use client'

import { CollapsibleCard } from "@/components/collapsible-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from '@/lib/utils'
import { Clock, Download, Edit, RefreshCw, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { ApiConnect } from "@/components/account/ApiConnect"
import { Eye, EyeOff } from 'lucide-react'
import { PlatformDetails } from '../components/account/platformDetails'
import { useAuthStore } from "@/stores/authstore"
import { toast } from "sonner"
import apiClient from "@/api/apiClient"
import { apiurls } from "@/api/apiurls"

export default function AccountPage() {
  // Get user data from store
    const { user, updateUser, fetchUser } = useAuthStore()
  
  // State declarations
  const [showApiModal, setShowApiModal] = useState(false)
  const [email, setEmail] = useState(user?.email || "")
  const [isEditing, setIsEditing] = useState(false)
  const [timeZone, setTimeZone] = useState("GMT, India")
  const [is2FAEnabled, setIs2FAEnabled] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)

  // Fetch user profile on mount
  useEffect(() => {
    loadUserProfile()
  }, [])

  // Update local email state when user changes
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email)
    }
  }, [user])

  const loadUserProfile = async () => {
    setIsLoadingProfile(true)
    try {
      await fetchUser()
    } catch (error: any) {
      console.error("Failed to load user profile:", error)
      toast.error("Failed to load profile data")
    } finally {
      setIsLoadingProfile(false)
    }
  }

  // Handler functions
  const handleEmailEdit = async () => {
    if (isEditing) {
      // Save email
      setIsUpdatingProfile(true)
      try {
        const response = await apiClient.put(apiurls.userAuth.updateprofile, {
          email: email
        })
        
        if (response.data) {
          // Update store with new email using updateUser
          updateUser({ email: email })
          toast.success("Email updated successfully")
        }
      } catch (error: any) {
        console.error("Failed to update email:", error)
        toast.error(error.response?.data?.message || "Failed to update email")
        // Revert email to original
        setEmail(user?.email || "")
      } finally {
        setIsUpdatingProfile(false)
      }
    }
    setIsEditing(!isEditing)
  }

  const handlePasswordUpdate = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    try {
      const response = await apiClient.put(apiurls.userAuth.updateprofile, {
        currentPassword: currentPassword,
        newPassword: newPassword
      })
      
      toast.success("Password updated successfully")
      setShowPasswordModal(false)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setShowCurrentPassword(false)
      setShowNewPassword(false)
      setShowConfirmPassword(false)
    } catch (error: any) {
      console.error("Failed to update password:", error)
      toast.error(error.response?.data?.message || "Failed to update password")
    }
  }

  const handleUpdateDetails = async () => {
    setIsUpdatingProfile(true)
    try {
      await fetchUser()
      toast.success("Profile refreshed successfully")
    } catch (error: any) {
      console.error("Failed to refresh profile:", error)
      toast.error("Failed to refresh profile")
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handleDownloadInvoice = (invoiceId: number) => {
    console.log(`Downloading invoice ${invoiceId}`)
  }

  const handleDeletePlatform = (platformId: number) => {
    console.log(`Deleting platform ${platformId}`)
  }

  const handleUpgradePlan = () => {
    console.log("Navigate to pricing page")
  }

  const handleWallet = () => {
    console.log("Navigate to wallet page")
  }

  const handleSendInvite = () => {
    console.log("Sending invite...")
  }

  const handleSupport = () => {
    console.log("Navigate to support page")
  }

  const handleTutorials = () => {
    console.log("Navigate to tutorials page")
  }

  return (
    <div className="px-4 flex flex-col gap-4 mt-2">
      <div className="grid grid-cols-5 w-full gap-4">
        <CollapsibleCard title="Account Details" className='col-span-3'>
          {isLoadingProfile ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Name</div>
                      <div className="font-medium">{user?.name || "N/A"}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Account ID</div>
                      <div className="font-medium">{user?.id || "N/A"}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Email</div>
                      <div className="flex items-center gap-2 max-w-[200px]">
                        {isEditing ? (
                          <Input 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)}
                            className="h-8"
                            disabled={isUpdatingProfile}
                          />
                        ) : (
                          <div className="font-medium truncate">{user?.email || "N/A"}</div>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={handleEmailEdit}
                          className="h-8 w-8 flex-shrink-0"
                          disabled={isUpdatingProfile}
                        >
                          {isUpdatingProfile ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Edit className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Plan Name</div>
                      <div className="font-medium">{user?.planName || "Premium"}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Duration</div>
                      <div className="font-medium">{user?.planDuration || "24 Months"}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">KYC</div>
                      <Badge variant={user?.kycStatus === "verified" ? "success" : "warning"}>
                        {user?.kycStatus === "verified" ? "Verified" : "Pending"}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Time Zone</div>
                    <div className="flex items-center gap-2 max-w-[200px] bg-white dark:bg-[#232326]">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <Select value={timeZone} onValueChange={setTimeZone}>
                        <SelectTrigger className="bg-white dark:bg-[#232326] text-black dark:text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-[#232326] text-black dark:text-white">
                          <SelectItem value="GMT, India">GMT, India</SelectItem>
                          <SelectItem value="PST, USA">PST, USA</SelectItem>
                          <SelectItem value="EST, USA">EST, USA</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col flex-wrap gap-3">
                  <Button 
                    className="bg-[#4A1C24] text-white hover:bg-[#3A161C] w-fit flex items-center gap-2"
                    onClick={handleUpdateDetails}
                    disabled={isUpdatingProfile}
                  >
                    {isUpdatingProfile ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Update Details
                  </Button>

                  <Button 
                    className="bg-[#4A1C24] text-white hover:bg-[#3A161C] w-fit"
                    onClick={() => setShowPasswordModal(true)}
                  >
                    Change Password
                  </Button>

                  <Button 
                    className="bg-[#4A1C24] text-white hover:bg-[#3A161C] w-fit" 
                    onClick={handleUpgradePlan}
                  >
                    Upgrade/Renew Plan
                  </Button>

                  <div className="flex gap-3">
                    <Button 
                      className="bg-orange-500 text-white hover:bg-orange-600 w-fit" 
                      onClick={handleWallet}
                    >
                      Wallet
                    </Button>

                    <Button
                      className="bg-[#4A1C24] text-white hover:bg-[#3A161C] w-fit"
                      onClick={handleSendInvite}
                    >
                      Send Invite
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CollapsibleCard>

        {/* API Connect Section */}
        <CollapsibleCard
          title="API Connect"
          className="col-span-2"
        >
          <ApiConnect
            userId={user?.id?.toString()}
            showModal={showApiModal}
            setShowModal={setShowApiModal}
          />
        </CollapsibleCard>
      </div>

      <div className="grid grid-cols-5 w-full gap-4">
        <CollapsibleCard title="Invoice Details" className='col-span-3'>
          <Table>
            <TableHeader className="dark:text-white">
              <TableRow>
                <TableHead>S.No</TableHead>
                <TableHead>Plan Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className='w-fit'>Download Invoice</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4].map((i) => (
                <TableRow key={i} className="hover:bg-muted/50">
                  <TableCell>{i}</TableCell>
                  <TableCell>Premium</TableCell>
                  <TableCell>12 July 2024</TableCell>
                  <TableCell>{formatCurrency(345)}</TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className='w-fit'
                      onClick={() => handleDownloadInvoice(i)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CollapsibleCard>

        <CollapsibleCard title="Platform Details" className='col-span-2'>
          <PlatformDetails onDelete={handleDeletePlatform} />
        </CollapsibleCard>
      </div>

      <div className="grid grid-cols-5 w-full gap-4">
        <CollapsibleCard title="Referral Settings" className='col-span-3'>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Pending Referrals</div>
                <div className="font-medium">323</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Active Referrals</div>
                <div className="font-medium">500</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Payment Option</div>
                <Select defaultValue="paypal">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paypal">PayPal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Email</div>
                <div className="flex items-center gap-2 max-w-[200px]">
                  <div className="font-medium truncate">{user?.email || "N/A"}</div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <Table>
              <TableHeader className="bg-[#4A0D0D] dark:bg-[#3b3b41] text-white">
                <TableRow>
                  <TableHead>S.No</TableHead>
                  <TableHead>Joined Date</TableHead>
                  <TableHead>Referral Name</TableHead>
                  <TableHead>Account ID</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3, 4].map((i) => (
                  <TableRow key={i} className="hover:bg-muted/50">
                    <TableCell>1</TableCell>
                    <TableCell>12 July 2024</TableCell>
                    <TableCell>Himesh Raj</TableCell>
                    <TableCell>123456791</TableCell>
                    <TableCell>
                      <Badge variant={i === 3 ? "warning" : "success"}>
                        {i === 3 ? "Pending" : "Verified"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CollapsibleCard>

        <CollapsibleCard title="Other Settings" className='col-span-2 w-full'>
          <div className="space-y-6 w-full">
            <div className="flex items-center justify-between w-full">
              <div className="font-medium">2 Factor Authentication</div>
              <Switch 
                checked={is2FAEnabled}
                onCheckedChange={setIs2FAEnabled}
              />
            </div>
            <div className="flex items-center justify-between w-full">
              <div className="font-medium">Having Trouble?</div>
              <Button 
                className="bg-[#4A1C24] text-white hover:bg-[#3A161C]"
                onClick={handleSupport}
              >
                Support
              </Button>
            </div>
            <div className="flex items-center justify-between w-full">
              <div className="font-medium">Learn More</div>
              <Button 
                className="bg-[#4A1C24] text-white hover:bg-[#3A161C]"
                onClick={handleTutorials}
              >
                Tutorials
              </Button>
            </div>
          </div>
        </CollapsibleCard>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#232326] dark:text-white p-6 rounded-lg w-[400px] max-w-full shadow-2xl border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Change Password</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Current Password</label>
                <div className="relative">
                  <Input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="mt-1 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-1 h-8"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">New Password</label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-1 h-8"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Confirm New Password</label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-1 h-8"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPasswordModal(false)
                    setShowCurrentPassword(false)
                    setShowNewPassword(false)
                    setShowConfirmPassword(false)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-[#4A1C24] text-white hover:bg-[#3A161C]"
                  onClick={handlePasswordUpdate}
                >
                  Update Password
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}