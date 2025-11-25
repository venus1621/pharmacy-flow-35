import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authApi, pharmaciesApi } from "@/services/backendApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ShoppingCart, Check, ArrowLeft } from "lucide-react";
import heroImage from "@/assets/pharmacy-hero-bg.jpg";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedPlan = searchParams.get("plan") || "small_business";
  
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
  const [signInData, setSignInData] = useState({
    email: "",
    password: ""
  });

  useEffect(() => {
    setPharmacyData(prev => ({ ...prev, plan: selectedPlan }));
  }, [selectedPlan]);

  const handleCreatePharmacy = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create the owner account with pharmacy in one request
      const result = await authApi.signUp({
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

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await authApi.signIn({
        email: signInData.email,
        password: signInData.password,
      });

      toast.success("Signed in successfully!");
      const redirectPath = result.user.role === "owner" ? "/owner" : "/pharmacist";
      navigate(redirectPath);
    } catch (error: any) {
      toast.error(error.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const plans = {
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
    custom: {
      name: "Custom",
      price: "Contact Us",
      features: ["Unlimited Branches", "Unlimited Pharmacists", "Custom Features", "Dedicated Support"]
    }
  };

  const currentPlan = plans[pharmacyData.plan as keyof typeof plans];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Auth */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url(${heroImage})`,
            filter: 'brightness(0.3)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-transparent to-accent/40" />
        
        <div className="relative z-10 w-full max-w-6xl px-4 py-12">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-6 text-white hover:text-white/80 hover:bg-white/10"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>

          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Left Side - Branding */}
            <div className="text-white space-y-6">
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-2xl mb-4">
                <ShoppingCart className="h-10 w-10 text-primary-foreground" />
              </div>
              <h1 className="text-5xl md:text-6xl font-bold drop-shadow-lg">
                Gebeta Pharmacy
              </h1>
              <p className="text-xl text-gray-100 drop-shadow-md leading-relaxed">
                Transform your pharmacy operations with our comprehensive management system
              </p>
              
              {/* Selected Plan Display */}
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Selected Plan: {currentPlan.name}</CardTitle>
                  <CardDescription className="text-gray-200">{currentPlan.price}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {currentPlan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-white">
                        <Check className="h-4 w-4 text-accent" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/#pricing")}
                    className="w-full mt-4 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
                  >
                    Change Plan
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Right Side - Auth Forms */}
            <Card className="shadow-2xl bg-card/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Get Started</CardTitle>
                <CardDescription>Sign in to your account or create your pharmacy</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue={searchParams.get("plan") ? "create" : "signin"} className="space-y-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="create">Create Pharmacy</TabsTrigger>
                    <TabsTrigger value="signin">Sign In</TabsTrigger>
                  </TabsList>

                  <TabsContent value="create" className="space-y-4">
                    <form onSubmit={handleCreatePharmacy} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="pharmacy-name">Pharmacy Name</Label>
                        <Input
                          id="pharmacy-name"
                          type="text"
                          placeholder="Your Pharmacy Name"
                          value={pharmacyData.pharmacyName}
                          onChange={(e) => setPharmacyData({ ...pharmacyData, pharmacyName: e.target.value })}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="address">Address</Label>
                          <Input
                            id="address"
                            type="text"
                            placeholder="Street Address"
                            value={pharmacyData.address}
                            onChange={(e) => setPharmacyData({ ...pharmacyData, address: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            type="text"
                            placeholder="City"
                            value={pharmacyData.city}
                            onChange={(e) => setPharmacyData({ ...pharmacyData, city: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+251 XXX XXX XXX"
                          value={pharmacyData.phone}
                          onChange={(e) => setPharmacyData({ ...pharmacyData, phone: e.target.value })}
                          required
                        />
                      </div>
                      
                      <div className="pt-4 border-t space-y-4">
                        <h3 className="font-semibold text-foreground">Owner Information</h3>
                        <div className="space-y-2">
                          <Label htmlFor="owner-name">Full Name</Label>
                          <Input
                            id="owner-name"
                            type="text"
                            placeholder="Your Full Name"
                            value={pharmacyData.ownerName}
                            onChange={(e) => setPharmacyData({ ...pharmacyData, ownerName: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="owner-email">Email</Label>
                          <Input
                            id="owner-email"
                            type="email"
                            placeholder="your.email@example.com"
                            value={pharmacyData.email}
                            onChange={(e) => setPharmacyData({ ...pharmacyData, email: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="owner-password">Password</Label>
                          <Input
                            id="owner-password"
                            type="password"
                            placeholder="Minimum 6 characters"
                            value={pharmacyData.password}
                            onChange={(e) => setPharmacyData({ ...pharmacyData, password: e.target.value })}
                            required
                            minLength={6}
                          />
                        </div>
                      </div>
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Creating Your Pharmacy..." : "Create Pharmacy"}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="signin" className="space-y-4">
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email">Email</Label>
                        <Input
                          id="signin-email"
                          type="email"
                          placeholder="your.email@example.com"
                          value={signInData.email}
                          onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signin-password">Password</Label>
                        <Input
                          id="signin-password"
                          type="password"
                          value={signInData.password}
                          onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Signing in..." : "Sign In"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          <p className="text-center text-sm text-white/80 mt-8">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </section>
    </div>
  );
};

export default Auth;
