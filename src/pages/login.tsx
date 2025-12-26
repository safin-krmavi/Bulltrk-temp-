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
import { useForm } from "react-hook-form"
import { Link } from "react-router-dom"
import { LoginInput, loginSchema } from "../schema"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { forgotPasswordSchema, ForgotPasswordInput } from "../schema";
import apiClient from "@/api/apiClient";
import { useState } from "react";

const LoginPage = () => {
  const { login } = useAuth()

  const loginForm = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    reValidateMode: 'onBlur',
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false
    },
  })

  const [forgotOpen, setForgotOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const forgotForm = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onChange',
    reValidateMode: 'onBlur',
    defaultValues: { email: '' },
  });

  async function onSubmit(values: LoginInput) {
    await login.mutateAsync({
      email: values.email,
      password: values.password
    });
  }

  async function onForgotSubmit(values: ForgotPasswordInput) {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    const loadingToast = toast.loading("Sending reset link... Please wait.");
    
    try {
      const response = await apiClient.post("/forgot-password", { 
        email: values.email 
      });
      
      if (response.status === 200 || response.status === 201) {
        toast.dismiss(loadingToast);
        toast.success(`A password reset link has been sent to ${values.email}. Please check your email inbox and spam folder.`, { duration: 8000 });
        forgotForm.reset();
        setForgotOpen(false);
      } else {
        throw new Error("Unexpected response from server");
      }
    } catch (err: any) {
      console.error("Forgot password error:", err);
      
      toast.dismiss(loadingToast);
      
      if (err.response?.status === 404) {
        toast.error(`No account found with email: ${values.email}. Please check the email address or register a new account.`, { duration: 6000 });
      } else if (err.response?.status === 429) {
        toast.error("You've made too many requests. Please wait 5 minutes before trying again.", { duration: 6000 });
      } else if (err.response?.status === 422) {
        toast.error("Please enter a valid email address.", { duration: 5000 });
      } else if (err.response?.data?.message) {
        toast.error(err.response.data.message, { duration: 6000 });
      } else if (err.code === 'NETWORK_ERROR' || err.message?.includes('Network Error')) {
        toast.error("Please check your internet connection and try again.", { duration: 6000 });
      } else {
        toast.error("We're experiencing technical difficulties. Please try again in a few minutes.", { duration: 6000 });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-white py-2 text-black">
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: none; } }
        .animate-fadeIn { animation: fadeIn 0.8s cubic-bezier(0.4,0,0.2,1) both; }
      `}</style>
      <h1 className="font-medium text-[32px] text-center mb-3">Login</h1>
      <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-lg p-4 md:p-6 animate-fadeIn text-black">
        <Form {...loginForm}>
          <form onSubmit={loginForm.handleSubmit(onSubmit)} className="flex flex-col gap-8 items-center">
            <div className="w-full flex flex-col gap-1">
              <FormField
                control={loginForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter email/username" 
                        className="rounded-lg px-[28px] py-[24px] text-[16px] text-greyText" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={loginForm.control}
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
              <div className="flex justify-between items-center">
                <FormField
                  control={loginForm.control}
                  name="rememberMe"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <label className="flex gap-2 items-center text-greyText">
                          <Input 
                            type="checkbox" 
                            className="w-4 border-2 border-[#8F8F8F]" 
                            checked={field.value} 
                            onChange={(e) => field.onChange(e.target.checked)}
                          />
                          <span className="text-[#8F8F8F] text-[14px]">Remember me</span>
                        </label>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <button
                  type="button"
                  className="text-[#8F8F8F] text-[14px] underline focus:outline-none"
                  onClick={() => setForgotOpen(true)}
                >
                  Forgot Password?
                </button>
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full border-none text-[18px] shadow-none bg-secondary-50 text-white py-3 mt-1 rounded-lg transition-transform duration-200 hover:scale-105 active:scale-100"
              disabled={login.isPending}
            >
              {login.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Logging in...</span>
                </div>
              ) : (
                "Login"
              )}
            </Button>
          </form>
        </Form>
      </div>
      <div className="flex flex-col gap-2 items-center mt-3 text-black">
        <p className="text-[#525252] text-[12px]">Or continue with</p>
        <div className="flex gap-4 mt-1">
          <button className="border-none rounded-full shadow-md p-2 bg-white hover:bg-gray-100 transition-transform duration-200 hover:scale-110 active:scale-100">
            <img src="/icons/google.svg" alt="Google login" className="w-8 h-8" />
          </button>
          <button className="border-none rounded-full shadow-md p-2 bg-white hover:bg-gray-100 transition-transform duration-200 hover:scale-110 active:scale-100">
            <img src="/icons/facebook.svg" alt="Facebook login" className="w-8 h-8" />
          </button>
        </div>
        <Link to="/register" className="text-[#8F8F8F] text-[14px] underline mt-1">
          New User?
        </Link>
      </div>
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="animate-fadeIn bg-white text-black">
          <DialogHeader>
            <DialogTitle>Forgot Password</DialogTitle>
            <DialogDescription>
              Enter your email address to receive a password reset link.
            </DialogDescription>
          </DialogHeader>
          <Form {...forgotForm}>
            <form onSubmit={forgotForm.handleSubmit(onForgotSubmit)} className="flex flex-col gap-4 mt-2">
              <FormField
                control={forgotForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        className="rounded-lg px-4 py-2 text-[16px] text-greyText w-full"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-[#f59120] text-white text-[18px] py-3 mt-1 rounded-lg transition-transform duration-200 hover:scale-105 active:scale-100" disabled={isSubmitting}>
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sending...</span>
                  </div>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default LoginPage