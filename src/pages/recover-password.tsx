// import { Button } from "@/components/ui/button"
// import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
// import { PasswordInput } from "@/components/ui/password-input"
// import { NewPasswordInput, newPasswordSchema } from "@/schema"
// import { zodResolver } from "@hookform/resolvers/zod"
// import { useForm } from "react-hook-form"
// import { useRecoverPassword } from "@/hooks/useRecoverPassword"
// import { toast } from "sonner"
// import { useNavigate, useLocation } from "react-router-dom"

// const RecoverPasswordPage = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const recoverPassword = useRecoverPassword();
  
//   // Get the verified code from the previous page
//   const verifiedCode = location.state?.verifiedCode;

//   const form = useForm<NewPasswordInput>({
//     resolver: zodResolver(newPasswordSchema),
//     defaultValues: {
//       confirmPassword: '',
//       newPassword: '',
//     },
//   })

//   async function onSubmit(values: NewPasswordInput) {
//     if (values.newPassword !== values.confirmPassword) {
//       toast.error("Passwords do not match", {
//         description: "Please make sure both passwords are identical",
//         duration: 5000,
//       });
//       return;
//     }

//     try {
//       await recoverPassword.mutateAsync({
//         newPassword: values.newPassword,
//         confirmPassword: values.confirmPassword,
//         token: verifiedCode // Use the verified code as token
//       });
      
//       toast.success("Password Updated Successfully", {
//         description: "Your password has been reset. You can now login with your new password.",
//         duration: 5000,
//       });
      
//       // Reset form
//       form.reset();
      
//       // Redirect to login page after a short delay
//       setTimeout(() => {
//         navigate('/login');
//       }, 2000);
      
//     } catch (error: any) {
//       toast.error("Failed to Reset Password", {
//         description: error.response?.data?.message || "Please try again or contact support",
//         duration: 5000,
//       });
//     }
//   }

//   return (
//     <div className="flex flex-col gap-8 items-center h-full w-full">
//       <h1 className="font-medium text-[32px] text-center pt-16">Recover Password</h1>
//         <div className="flex flex-col items-center p-16  w-full"> 
//             <Form {...form}>
//                 <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-20 max-w-4xl w-full items-center ">
//                     <div className="flex max-w-xl w-full flex-col gap-4 ">
//                         <FormField
//                         control={form.control}
//                         name="newPassword"
//                         render={({ field }) => (
//                             <FormItem>
//                                 <FormLabel>Password</FormLabel>
//                                 <FormControl>
//                                 <PasswordInput placeholder="Password" className="rounded-lg px-[28px]  py-[24px] text-[16px] text-greyText"  {...field} />
//                                 </FormControl>
//                                 <FormMessage />
//                             </FormItem>
//                             )}
//                             />
//                             <FormField
//                             control={form.control}
//                             name="confirmPassword"
//                             render={({ field }) => (
//                             <FormItem>
//                                 <FormLabel>Re-Enter Password</FormLabel>
//                                 <FormControl>
//                                 <PasswordInput placeholder="Re-Enter password" className="rounded-lg px-[28px] py-[24px] text-[16px] text-greyText"  {...field} />
//                                 </FormControl>
//                                 <FormMessage />
//                             </FormItem>
//                             )}
//                             />
//                     </div>

//                 <Button 
//                   type="submit" 
//                   className="max-w-xl w-full border-none text-[20px] shadow-none bg-secondary-50 text-white py-6"
//                   disabled={recoverPassword.isPending}
//                 >
//                   {recoverPassword.isPending ? "Updating Password..." : "Confirm"}
//                 </Button>
//             </form>
//             </Form>
        
//         </div>
//     </div>
//   )
// }

// export default RecoverPasswordPage