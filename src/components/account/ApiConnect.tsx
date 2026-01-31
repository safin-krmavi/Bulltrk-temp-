import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { X, CheckCircle, Loader2, BadgePlus, Plus } from "lucide-react";
import apiClient from "@/api/apiClient";
import { apiurls } from "@/api/apiurls";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authstore";

interface ApiConnectProps {
  userId?: string;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
}

interface BrokerageConnection {
  id: string;
  userId: string;
  exchange: string;
  apiKey: string;
  apiSecret: string;
  apiPassphrase?: string;
  apiKeyVersion?: string;
  createdAt: string;
  updatedAt: string;
}

const PLATFORMS = [
  { value: "BINANCE", label: "Binance" },
  { value: "COINDCX", label: "CoinDCX" },
  { value: "KUCOIN", label: "KuCoin" },
];

const API_KEY_VERSION = "v3"; // Constant version

export const ApiConnect: React.FC<ApiConnectProps> = ({
  userId,
  showModal,
  setShowModal,
}) => {
  const [platform, setPlatform] = useState("");
  const [apiName, setApiName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [passPhrase, setPassPhrase] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [isLoadingApis, setIsLoadingApis] = useState(false);
  const [connections, setConnections] = useState<BrokerageConnection[]>([]);

  const { user } = useAuthStore();

  useEffect(() => {
    if (user?.id) {
      fetchConnections();
    }
  }, [user?.id]);

  const fetchConnections = async () => {
    setIsLoadingApis(true);
    try {
      const userIdToUse = userId || user?.id;
      if (!userIdToUse) {
        console.error("No user ID available");
        return;
      }

      const url = apiurls.credentials.getConnections.replace(':userId', userIdToUse);
      const response = await apiClient.get(url);
      
      if (response.data?.data) {
        const connectionsData = Array.isArray(response.data.data) 
          ? response.data.data 
          : [response.data.data];
        setConnections(connectionsData);
      }
    } catch (error: any) {
      console.error("Failed to fetch connections:", error);
      if (error.response?.status !== 404) {
        toast.error("Failed to load API connections");
      }
    } finally {
      setIsLoadingApis(false);
    }
  };

  const handleAddApi = async () => {
    setConnectionStatus('loading');
    
    try {
      const userIdToUse = userId || user?.id;
      if (!userIdToUse) {
        toast.error("User ID not available");
        setConnectionStatus('idle');
        return;
      }

      const payload: any = {
        userId: userIdToUse,
        exchange: platform.toUpperCase(),
        apiKey: apiKey,
        apiSecret: apiSecret,
        apiKeyVersion: API_KEY_VERSION, // Always send v3
      };

      // Add passphrase if provided
      if (passPhrase) {
        payload.apiPassphrase = passPhrase;
      }

      console.log("Creating credentials with payload:", payload);

      // Create credentials
      const response = await apiClient.post(
        apiurls.credentials.createCredentials,
        payload
      );

      if (response.data?.data) {
        setConnectionStatus('success');
        toast.success("API credentials added successfully!");

        // Refresh the connections list to get updated data from server
        await fetchConnections();

        // Reset form after success animation
        setTimeout(() => {
          setShowModal(false);
          resetForm();
        }, 1500);
      }
    } catch (err: any) {
      setConnectionStatus('idle');
      console.error("Failed to add API credentials:", err);
      
      const errorMessage = 
        err.response?.data?.message || 
        "Failed to add API credentials. Please check your credentials and try again.";
      
      toast.error(errorMessage);
    }
  };

  const handleDeleteApi = async (id: string) => {
    try {
      const url = apiurls.credentials.updateCrendential.replace(':id', id);
      await apiClient.delete(url);
      
      toast.success("API connection deleted successfully");
      await fetchConnections(); // Refresh list
    } catch (error: any) {
      console.error("Failed to delete API:", error);
      toast.error(error.response?.data?.message || "Failed to delete API connection");
    }
  };

  const resetForm = () => {
    setPlatform("");
    setApiName("");
    setApiKey("");
    setApiSecret("");
    setPassPhrase("");
    setConnectionStatus('idle');
  };

  // Helper function to get platform label from exchange value
  const getPlatformLabel = (exchange: string) => {
    const platform = PLATFORMS.find(p => p.value.toUpperCase() === exchange.toUpperCase());
    return platform ? platform.label : exchange;
  };

  return (
    <div>
      <div className="w-full">
        {isLoadingApis ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : connections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <button
              onClick={() => setShowModal(true)}
              className="flex flex-col items-center gap-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors group"
            >
              <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-[#2A2A2D] flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-[#333336] transition-colors">
                <BadgePlus className="w-10 h-10" />
              </div>
              <span className="text-sm font-medium">Add API Connection</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <Table className="min-w-full text-sm">
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-2 py-1">Platform</TableHead>
                    <TableHead className="px-2 py-1">API Key</TableHead>
                    <TableHead className="px-2 py-1">API Secret</TableHead>
                    <TableHead className="px-2 py-1">Status</TableHead>
                    <TableHead className="px-2 py-1">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {connections.map((connection) => (
                    <TableRow key={connection.id}>
                      <TableCell className="px-2 py-1">
                        {getPlatformLabel(connection.exchange)}
                      </TableCell>
                      <TableCell className="px-2 py-1">
                        {connection.apiKey ? "****" + connection.apiKey.slice(-4) : "****"}
                      </TableCell>
                      <TableCell className="px-2 py-1">
                        {connection.apiSecret ? "****" + connection.apiSecret.slice(-4) : "****"}
                      </TableCell>
                      <TableCell className="px-2 py-1">
                        <span className="flex items-center gap-1">
                          <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                          <span className="font-medium text-green-600 dark:text-green-400">
                            Connected
                          </span>
                        </span>
                      </TableCell>
                      <TableCell className="px-2 py-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                          onClick={() => handleDeleteApi(connection.id)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Add More Button */}
            <div className="flex justify-end">
              <Button
                onClick={() => setShowModal(true)}
                variant="ghost"
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add More
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#232326] dark:text-white dark:border dark:border-[#333] rounded-xl p-8 w-[500px] relative transition-colors">
            <button
              className="absolute top-4 right-4"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
              disabled={connectionStatus === 'loading'}
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-center text-lg font-semibold mb-6">ADD API</h2>
            {connectionStatus === 'success' ? (
              <div className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="w-16 h-16 text-green-500 animate-bounce mb-4" />
                <div className="text-xl font-semibold text-green-600">Connected!</div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm mb-1">Platform</label>
                    <Select value={platform} onValueChange={setPlatform} disabled={connectionStatus === 'loading'}>
                      <SelectTrigger>
                        <SelectValue placeholder="Platform name" />
                      </SelectTrigger>
                      <SelectContent>
                        {PLATFORMS.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">API Name</label>
                    <Input
                      placeholder="Enter API Name"
                      value={apiName}
                      onChange={(e) => setApiName(e.target.value)}
                      disabled={connectionStatus === 'loading'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">API Key</label>
                    <Input
                      placeholder="Enter API Key"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      disabled={connectionStatus === 'loading'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">API Secret</label>
                    <Input
                      placeholder="Enter API Secret"
                      value={apiSecret}
                      onChange={(e) => setApiSecret(e.target.value)}
                      disabled={connectionStatus === 'loading'}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm mb-1">Pass Phrase</label>
                    <Input
                      placeholder="Enter Pass Phrase (Optional)"
                      value={passPhrase}
                      onChange={(e) => setPassPhrase(e.target.value)}
                      disabled={connectionStatus === 'loading'}
                    />
                  </div>
                </div>
                <Button
                  className="w-full bg-[#4A1C24] text-white hover:bg-[#3A161C] rounded flex items-center justify-center"
                  onClick={handleAddApi}
                  disabled={
                    !platform ||
                    !apiKey ||
                    !apiSecret ||
                    connectionStatus === 'loading'
                  }
                >
                  {connectionStatus === 'loading' ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    'Submit'
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};