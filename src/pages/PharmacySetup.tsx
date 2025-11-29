import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authApi, pharmaciesApi } from "@/services/backendApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { ShoppingCart, Check, ArrowLeft, Shield, BarChart3, Users } from "lucide-react";

const PharmacySetup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedPlan = searchParams.get("plan") || "testing";
  
  const [loading, setLoading] = useState(false);
  const [pharmacyData, setPharmacyData] = useState({
    pharmacyName: "",
    address: "",
    city: "",
    phone: "",
    ownerName: "",
    email: "",
    password: "",
    plan: selectedPlan,
  });

  useEffect(() => {
    setPharmacyData(prev => ({ ...prev, plan: selectedPlan }));
  }, [selectedPlan]);

  const handleCreatePharmacy = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Sign up the owner
      const authResult = await authApi.signUp({
        email: pharmacyData.email,
        password: pharmacyData.password,
        full_name: pharmacyData.ownerName,
        role: "owner",
        pharmacy_name: pharmacyData.pharmacyName,
        pharmacy_address: `${pharmacyData.address}, ${pharmacyData.city}`,
        pharmacy_phone: pharmacyData.phone
      });

      toast.success("Pharmacy registered successfully! Redirecting...");
      
      setTimeout(() => {
        navigate("/owner");
      }, 500);
    } catch (error: any) {
      toast.error(error.message || "Failed to register pharmacy");
    } finally {
      setLoading(false);
    }
  };

  const plans = {
    testing: {
      name: "Free Testing",
      price: "Free for 30 days",
      features: ["All features unlocked", "Up to 1 Branch", "Up to 2 Pharmacists", "Test data environment"]
    },
    small_business: {
      name: "Small Business",
      price: "1,999 ETB/month",
      features: ["Up to 2 Branches", "Up to 6 Pharmacists", "Inventory Management", "Real-Time Alerts"]
    },
    enterprise: {
      name: "Enterprise",
      price: "3,000 ETB/month",
      features: ["Up to 5 Branches", "Up to 15 Pharmacists", "Advanced Analytics", "Priority Support"]
    },
  };

  const currentPlan = plans[pharmacyData.plan as keyof typeof plans];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <ShoppingCart className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Gebeta Pharmacy</h1>
              <p className="text-xs text-muted-foreground">Management System</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Create Your Pharmacy Account</h2>
          <p className="text-muted-foreground">Get started in minutes with our powerful management system</p>
        </div>

        <Card className="shadow-xl border-border/50">
          <CardContent className="p-8">
            <form onSubmit={handleCreatePharmacy} className="space-y-8">
              {/* Plan Selection */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">1</span>
                  </div>
                  <h3 className="text-lg font-semibold">Select Your Plan</h3>
                </div>
                <RadioGroup value={pharmacyData.plan} onValueChange={(value) => setPharmacyData({ ...pharmacyData, plan: value })}>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all ${pharmacyData.plan === 'testing' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                      <RadioGroupItem value="testing" id="testing" className="absolute top-4 right-4" />
                      <Label htmlFor="testing" className="cursor-pointer block">
                        <div className="font-semibold text-base mb-1">Free Testing</div>
                        <div className="text-2xl font-bold text-primary mb-2">Free</div>
                        <div className="text-xs text-muted-foreground mb-3">30 days trial</div>
                        <ul className="space-y-1 text-xs">
                          <li className="flex items-center gap-1">
                            <Check className="h-3 w-3 text-primary" />
                            <span>All features</span>
                          </li>
                          <li className="flex items-center gap-1">
                            <Check className="h-3 w-3 text-primary" />
                            <span>1 Branch</span>
                          </li>
                          <li className="flex items-center gap-1">
                            <Check className="h-3 w-3 text-primary" />
                            <span>2 Pharmacists</span>
                          </li>
                        </ul>
                      </Label>
                    </div>
                    <div className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all ${pharmacyData.plan === 'small_business' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                      <RadioGroupItem value="small_business" id="small_business" className="absolute top-4 right-4" />
                      <Label htmlFor="small_business" className="cursor-pointer block">
                        <div className="font-semibold text-base mb-1">Small Business</div>
                        <div className="text-2xl font-bold text-primary mb-2">1,999 ETB</div>
                        <div className="text-xs text-muted-foreground mb-3">per month</div>
                        <ul className="space-y-1 text-xs">
                          <li className="flex items-center gap-1">
                            <Check className="h-3 w-3 text-primary" />
                            <span>2 Branches</span>
                          </li>
                          <li className="flex items-center gap-1">
                            <Check className="h-3 w-3 text-primary" />
                            <span>6 Pharmacists</span>
                          </li>
                          <li className="flex items-center gap-1">
                            <Check className="h-3 w-3 text-primary" />
                            <span>24/7 Support</span>
                          </li>
                        </ul>
                      </Label>
                    </div>
                    <div className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all ${pharmacyData.plan === 'enterprise' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                      <RadioGroupItem value="enterprise" id="enterprise" className="absolute top-4 right-4" />
                      <Label htmlFor="enterprise" className="cursor-pointer block">
                        <div className="font-semibold text-base mb-1">Enterprise</div>
                        <div className="text-2xl font-bold text-primary mb-2">3,000 ETB</div>
                        <div className="text-xs text-muted-foreground mb-3">per month</div>
                        <ul className="space-y-1 text-xs">
                          <li className="flex items-center gap-1">
                            <Check className="h-3 w-3 text-primary" />
                            <span>5 Branches</span>
                          </li>
                          <li className="flex items-center gap-1">
                            <Check className="h-3 w-3 text-primary" />
                            <span>15 Pharmacists</span>
                          </li>
                          <li className="flex items-center gap-1">
                            <Check className="h-3 w-3 text-primary" />
                            <span>Priority Support</span>
                          </li>
                        </ul>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Pharmacy Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">2</span>
                  </div>
                  <h3 className="text-lg font-semibold">Pharmacy Information</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="pharmacy-name">Pharmacy Name *</Label>
                    <Input
                      id="pharmacy-name"
                      type="text"
                      placeholder="Enter your pharmacy name"
                      value={pharmacyData.pharmacyName}
                      onChange={(e) => setPharmacyData({ ...pharmacyData, pharmacyName: e.target.value })}
                      required
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Street Address *</Label>
                    <Input
                      id="address"
                      type="text"
                      placeholder="Street address"
                      value={pharmacyData.address}
                      onChange={(e) => setPharmacyData({ ...pharmacyData, address: e.target.value })}
                      required
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      type="text"
                      placeholder="City"
                      value={pharmacyData.city}
                      onChange={(e) => setPharmacyData({ ...pharmacyData, city: e.target.value })}
                      required
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+251 XXX XXX XXX"
                      value={pharmacyData.phone}
                      onChange={(e) => setPharmacyData({ ...pharmacyData, phone: e.target.value })}
                      required
                      className="h-11"
                    />
                  </div>
                </div>
              </div>

              {/* Owner Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">3</span>
                  </div>
                  <h3 className="text-lg font-semibold">Owner Account</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="owner-name">Full Name *</Label>
                    <Input
                      id="owner-name"
                      type="text"
                      placeholder="Your full name"
                      value={pharmacyData.ownerName}
                      onChange={(e) => setPharmacyData({ ...pharmacyData, ownerName: e.target.value })}
                      required
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="owner-email">Email Address *</Label>
                    <Input
                      id="owner-email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={pharmacyData.email}
                      onChange={(e) => setPharmacyData({ ...pharmacyData, email: e.target.value })}
                      required
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="owner-password">Password *</Label>
                    <Input
                      id="owner-password"
                      type="password"
                      placeholder="Min. 6 characters"
                      value={pharmacyData.password}
                      onChange={(e) => setPharmacyData({ ...pharmacyData, password: e.target.value })}
                      required
                      minLength={6}
                      className="h-11"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button type="submit" size="lg" className="w-full h-12 text-base" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Creating Your Account...
                    </>
                  ) : (
                    <>
                      Create Pharmacy Account
                      <Check className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
                <p className="text-center text-xs text-muted-foreground mt-4">
                  By continuing, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Features Footer */}
        <div className="mt-8 grid md:grid-cols-3 gap-6 text-center">
          <div className="space-y-2">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h4 className="font-semibold text-sm">Secure & Reliable</h4>
            <p className="text-xs text-muted-foreground">Bank-level security for your data</p>
          </div>
          <div className="space-y-2">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <h4 className="font-semibold text-sm">Real-Time Analytics</h4>
            <p className="text-xs text-muted-foreground">Track your business performance</p>
          </div>
          <div className="space-y-2">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h4 className="font-semibold text-sm">24/7 Support</h4>
            <p className="text-xs text-muted-foreground">We're here to help you succeed</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PharmacySetup;