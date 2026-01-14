import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { useAuth } from "@/hooks/useAuth"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { Link, useNavigate } from "react-router-dom"
import { RegisterInput, registerSchema } from "../schema"

const ROLES = [
  { id: "1f0279f4-7164-4beb-abf0-60ea4c3cb0", name: "Trader" },
  { id: "3640bdca-70bc-409e-b0a8-bd3dee850a7b", name: "COPY_TRADER" },
  { id: "70621233-91b8-4190-b907-ef1264e5109d", name: "CRYPTO_TRADER" },

]

const RegisterPage = () => {
  const navigate = useNavigate()
  const [showSuccess, setShowSuccess] = useState(false)
  const { register } = useAuth()

  const registerForm = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      roleId: '',
    },
  })

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        navigate('/login')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [showSuccess, navigate])

  async function onSubmit(values: RegisterInput) {
    try {
      await register.mutateAsync(values)
      setShowSuccess(true)
    } catch (error) {
      console.error("Registration error:", error)
    }
  }

  if (showSuccess) {
    return (
      <div className="flex flex-col gap-8 items-center justify-center h-full w-full">
        <h1 className="font-medium text-[32px] text-center">Registration Successful!</h1>
        <p className="text-center text-[#525252]">Your account has been created successfully.</p>
        <p className="text-center text-[#8F8F8F]">Redirecting to login page...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 items-center h-full w-full">
      <h1 className="font-medium text-[32px] text-center pt-16">Register</h1>
      <div className="flex justify-center w-full"> 
        <Form {...registerForm}>
          <form onSubmit={registerForm.handleSubmit(onSubmit)} className="flex flex-col gap-10 items-center w-[25rem]">
            <div className="w-full flex flex-col gap-4">
              <FormField
                control={registerForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter Full Name" 
                        className="rounded-lg px-[28px] py-[24px] text-[16px] text-greyText" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={registerForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email"
                        placeholder="Enter Email" 
                        className="rounded-lg px-[28px] py-[24px] text-[16px] text-greyText" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={registerForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input 
                        type="tel"
                        placeholder="Enter Phone Number" 
                        className="rounded-lg px-[28px] py-[24px] text-[16px] text-greyText" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={registerForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <PasswordInput 
                        placeholder="Enter Password" 
                        className="rounded-lg px-[28px] py-[24px] text-[16px] text-greyText" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={registerForm.control}
                name="roleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Role</FormLabel>
                    <FormControl>
                      <select 
                        className="rounded-lg px-[28px] py-[24px] text-[16px] text-greyText border border-gray-300 w-full bg-white"
                        {...field}
                      >
                        <option value="">Select a role</option>
                        {ROLES.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full border-none text-[20px] shadow-none bg-secondary-50 text-white py-6"
              disabled={register.isPending}
            >
              {register.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Registering...</span>
                </div>
              ) : (
                "Register"
              )}
            </Button>
          </form>
        </Form>
      </div>

      <div className="flex flex-col gap-2 items-center pb-16">
        <p className="text-[#525252] text-[12px]">Or continue with</p>
        <div className="flex gap-4">
          <button className="border-none" type="button">
            <img src="/icons/google.svg" alt="Google login" />
          </button>
          <button className="border-none" type="button">
            <img src="/icons/facebook.svg" alt="Facebook login" />
          </button>
        </div>
        <Link to="/login" className="text-[#8F8F8F] text-[14px] underline">
          Already a User?
        </Link>
      </div>
    </div>
  )
}

export default RegisterPage