import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AppLayout, PublicLayout } from "@/components/Layout";
import { Landing } from "@/pages/Public";
import { Login, Register, ForgotPassword } from "@/pages/Auth";
import { Home } from "@/pages/Home";
import { MarketplaceHome, WantedPage, CreateListing, CreateWanted, MyMarketplace, ListingDetail, WantedDetail, EditListing, EditWanted } from "@/pages/Marketplace";
import { RoadAgent, WhatsAppAgent, ComingSoon } from "@/pages/Agents";
import { Account } from "@/pages/Account";

function Protected(){
    const{loading,token}=useAuth();
    if(loading)
        return <div className="app-loading">
                    <div className="spinner"/>
                    <span>
                        Loading Campus Hub...
                    </span>
                </div>;

    return token?<AppLayout/>:<Navigate to="/login" replace/>}

function App(){
    return <AuthProvider>
                <BrowserRouter>
                    <Routes>
                        <Route element={<PublicLayout/>}>
                            <Route path="/" element={<Landing/>}/>
                            <Route path="/login" element={<Login/>}/>
                            <Route path="/register" element={<Register/>}/>
                            <Route path="/forgot-password" element={<ForgotPassword/>}/>
                        </Route>
                        <Route element={<Protected/>}>
                            <Route path="/home" element={<Home/>}/>
                            <Route path="/marketplace" element={<MarketplaceHome/>}/>
                            <Route path="/marketplace/listings/create" element={<CreateListing/>}/>
                            <Route path="/marketplace/listings/:id" element={<ListingDetail/>}/>
                            <Route path="/marketplace/listings/:id/edit" element={<EditListing/>}/>
                            <Route path="/marketplace/wanted" element={<WantedPage/>}/>
                            <Route path="/marketplace/wanted/create" element={<CreateWanted/>}/>
                            <Route path="/marketplace/wanted/:id" element={<WantedDetail/>}/>
                            <Route path="/marketplace/wanted/:id/edit" element={<EditWanted/>}/>
                            <Route path="/marketplace/my-marketplace" element={<MyMarketplace/>}/>
                            <Route path="/agents/road" element={<RoadAgent/>}/>
                            <Route path="/agents/whatsapp" element={<WhatsAppAgent/>}/>
                            <Route path="/agents/email" element={<ComingSoon title="Email Assistant" description="Draft thoughtful email replies for you to review and send."/>}/>
                            <Route path="/agents/podcast" element={<ComingSoon title="Podcast Assistant" description="AI tools for planning, producing, and managing podcasts."/>}/>
                            <Route path="/account" element={<Account/>}/>
                        </Route>
                        <Route path="*" element={<Navigate to="/" replace/>}/>
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
}
export default App;
