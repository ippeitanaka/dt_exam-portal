"use client"

import { useState, useEffect } from "react"
import LoginForm from "@/components/login-form"
import AdminLoginForm from "@/components/admin-login-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import { Stethoscope } from "lucide-react"
import { DentalMascot } from "@/components/paramedic-mascot"

export default function Home() {
  const [activeTab, setActiveTab] = useState("student")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-white medical-pattern">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="flex justify-center mb-4">
            <motion.div
              animate={{ rotate: [0, 10, 0, -10, 0] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" }}
              className="relative"
            >
              <DentalMascot width={80} height={80} type="default" />
            </motion.div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">歯科技工士学科</h1>
          <p className="text-gray-600 mt-2">国家試験模擬試験 成績確認システム</p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="card-decorated">
            <CardContent className="pt-6">
              <Tabs defaultValue="student" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="student" className="data-[state=active]:bg-primary">
                    <div className="flex items-center gap-2">
                      <Stethoscope size={16} />
                      <span>学生</span>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger value="admin" className="data-[state=active]:bg-secondary">
                    <div className="flex items-center gap-2">
                      <DentalMascot width={20} height={20} type="small" />
                      <span>管理者</span>
                    </div>
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="student" className="mt-4">
                  <LoginForm />
                </TabsContent>
                <TabsContent value="admin" className="mt-4">
                  <AdminLoginForm />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </main>
  )
}
