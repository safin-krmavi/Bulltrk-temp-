 import React, { useEffect, useState } from "react";
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
import { X, CheckCircle, Loader2 } from "lucide-react";
import { BrokerageConnection, brokerageService } from "@/api/brokerage";
import { toast } from "sonner";

interface ApiConnectProps {
  userId?: string;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
}

const PLATFORMS = [
  { value: "binance", label: "Binance", requiresPassPhrase: false },
  { value: "zerodha", label: "Zerodha", requiresPassPhrase: false },
];

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
  const [apis, setApis] = useState<BrokerageConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const selectedPlatform = PLATFORMS.find((p) => p.value === platform);

  useEffect(() => {
    async function fetchBrokerages() {
      setLoading(true);
      try {
        const res = await brokerageService.getBrokerageDetails();
        setApis(res.data.data || []);
      } catch (err) {
        setApis([]);
      } finally {
        setLoading(false);
      }
    }
    fetchBrokerages();
  }, [userId]);

  const handleAddApi = async () => {
    setConnectionStatus('loading');
    try {
      await brokerageService.linkBrokerage({
        brokerage_name: platform as "zerodha" | "binance",
        brokerage_api_key: apiKey,
        brokerage_api_secret: apiSecret,
      });
      toast.success("Brokerage linked successfully!");
      setConnectionStatus('success');
      setTimeout(() => {
        setShowModal(false);
        setPlatform("");
        setApiName("");
        setApiKey("");
        setApiSecret("");
        setPassPhrase("");
        setConnectionStatus('idle');
      }, 1500);
      setLoading(true);
      const res = await brokerageService.getBrokerageDetails();
      setApis(res.data.data || []);
      setLoading(false);
    } catch (err: any) {
      setConnectionStatus('idle');
      toast.error("Failed to link brokerage.");
    }
  };

  return (
    <div>
      <div className="overflow-x-auto w-full">
  <Table className="min-w-full text-sm">
    <TableHeader>
      <TableRow>
        <TableHead className="px-2 py-1">Platform</TableHead>
        <TableHead className="px-2 py-1">API Key</TableHead>
        <TableHead className="px-2 py-1">API Secret</TableHead>
        <TableHead className="px-2 py-1">Status</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {loading ? (
        <TableRow>
          <TableCell colSpan={4} className="text-center py-6">
            Loading...
          </TableCell>
        </TableRow>
      ) : apis.length === 0 ? (
        <TableRow>
          <TableCell colSpan={4} className="text-center py-6">
            No brokerages connected yet.
          </TableCell>
        </TableRow>
      ) : (
        apis.map((api) => (
          <TableRow key={api.id}>
            <TableCell className="px-2 py-1">
              {api.brokerage?.name || api.brokerage_name}
            </TableCell>
            <TableCell className="px-2 py-1">
              {"****" + api.brokerage_api_key.slice(-4)}
            </TableCell>
            <TableCell className="px-2 py-1">
              {"****" + api.brokerage_api_secret.slice(-4)}
            </TableCell>
            <TableCell className="px-2 py-1">
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                <span className="text-green-600 font-medium">Connected</span>
              </span>
            </TableCell>
          </TableRow>
        ))
      )}
    </TableBody>
  </Table>
</div>


      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#232326] dark:text-white dark:border dark:border-[#333] rounded-xl p-8 w-[500px] relative transition-colors">
            <button
              className="absolute top-4 right-4"
              onClick={() => setShowModal(false)}
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
                    <label className="block text-sm mb-1">
                      {selectedPlatform?.requiresPassPhrase
                        ? "API Secret"
                        : "API Secret"}
                    </label>
                    <Input
                      placeholder={
                        selectedPlatform?.requiresPassPhrase
                          ? "Enter Pass Phrase"
                          : "Enter API Secret"
                      }
                      value={apiSecret}
                      onChange={(e) => setApiSecret(e.target.value)}
                      disabled={connectionStatus === 'loading'}
                    />
                  </div>
                  {selectedPlatform?.requiresPassPhrase && (
                    <div className="col-span-2">
                      <label className="block text-sm mb-1">Pass Phrase</label>
                      <Input
                        placeholder="Enter Pass Phrase"
                        value={passPhrase}
                        onChange={(e) => setPassPhrase(e.target.value)}
                        disabled={connectionStatus === 'loading'}
                      />
                    </div>
                  )}
                </div>
                <Button
                  className="w-full bg-[#4A1C24] text-white hover:bg-[#3A161C] rounded flex items-center justify-center"
                  onClick={handleAddApi}
                  disabled={
                    !platform ||
                    !apiName ||
                    !apiKey ||
                    !apiSecret ||
                    (selectedPlatform?.requiresPassPhrase && !passPhrase) ||
                    connectionStatus === 'loading'
                  }
                >
                  {connectionStatus === 'loading' ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : null}
                  {connectionStatus === 'loading' ? 'Connecting...' : 'Submit'}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
