import { useState } from 'react';
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { useBrokerage } from "@/hooks/useBrokerage";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

const COLOR_OPTIONS = [
  { label: 'Binance Yellow', value: '#FCD535' },
  { label: 'Bulltrek Red', value: '#4A1C24' },
  { label: 'Kucoin Green', value: '#24AE8F' },
  { label: 'Bybit Blue', value: '#1D81F5' },
  { label: 'Orange', value: '#F5841F' },
  { label: 'Purple', value: '#7B1FA2' },
  { label: 'Teal', value: '#009688' },
  { label: 'Deep Blue', value: '#1565C0' },
];

interface Brokerage {
  id: string;
  name: string;
  website: string | null;
  brokerage_type: string | null;
  created_at: string;
  updated_at: string;
}

interface CreateBrokeragePayload {
  name: string;
  website: string;
  registration_link: string;
  description: string;
  color_code: string;
  brokerage_type: string;
  api_base_url: string;
}

export function BrokeragesTable() {
  const { data: brokerages, isLoading, error, getBrokerageById, deleteBrokerage, createBrokerage } = useBrokerage();
  const [selectedBrokerage, setSelectedBrokerage] = useState<Brokerage | null>(null);
  const [searchId, setSearchId] = useState<string>("");
  const [brokerageToDelete, setBrokerageToDelete] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createFormData, setCreateFormData] = useState<CreateBrokeragePayload>({
    name: '',
    website: '',
    registration_link: '',
    description: '',
    color_code: '',
    brokerage_type: '',
    api_base_url: ''
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId) {
      try {
        const brokerageDetails = await getBrokerageById(searchId);
        setSelectedBrokerage(brokerageDetails.data);
      } catch (error) {
        console.error('Error fetching brokerage details:', error);
        setSelectedBrokerage(null);
      }
    } else {
      setSelectedBrokerage(null);
    }
  };

  const handleRowClick = async (id: string) => {
    try {
      const brokerageDetails = await getBrokerageById(id);
      setSelectedBrokerage(brokerageDetails.data);
    } catch (error) {
      console.error('Error fetching brokerage details:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBrokerage(id);
      toast.success('Brokerage deleted successfully');
      if (selectedBrokerage?.id === id) {
        setSelectedBrokerage(null);
      }
    } catch (error) {
      toast.error('Failed to delete brokerage');
    } finally {
      setBrokerageToDelete(null);
    }
  };

  const handleCreate = async () => {
    try {
      const formData = new FormData();
      Object.entries(createFormData).forEach(([key, value]) => {
        formData.append(key, value);
      });
      
      await createBrokerage(formData);
      toast.success('Brokerage created successfully');
      setShowCreateDialog(false);
      setCreateFormData({
        name: '',
        website: '',
        registration_link: '',
        description: '',
        color_code: '',
        brokerage_type: '',
        api_base_url: '',
      });
    } catch (error) {
      toast.error('Failed to create brokerage');
    }
  };

  return (
    <Card className="border bg-white dark:bg-[#232326] rounded-lg shadow-sm">
      <CardHeader className="bg-[#4A0D0D] text-white rounded-t-lg">
  <div className="flex items-center justify-between">
    <CardTitle className="text-lg font-medium">Brokerages</CardTitle>
    <div className="flex gap-2">
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          type="text"
          placeholder="Search by ID"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          className="w-[200px] bg-white dark:bg-[#232326] text-black dark:text-white"
        />
        <Button
          type="submit"
          variant="secondary"
          size="sm"
          className="bg-[#4A1C24] text-white hover:bg-[#3A161C]"
        >
          Search
        </Button>
      </form>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="bg-[#4A1C24] text-white hover:bg-[#3A161C]"
        onClick={() => setShowCreateDialog(true)}
      >
        Save Strategy
      </Button>
    </div>
  </div>
</CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[400px] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-white dark:bg-[#232326] z-10">
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Website</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Updated At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    Loading brokerages...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4 text-red-500">
                    Error loading brokerages
                  </TableCell>
                </TableRow>
              ) : selectedBrokerage ? (
                <TableRow className="hover:bg-muted/50">
                  <TableCell>{selectedBrokerage.id}</TableCell>
                  <TableCell>{selectedBrokerage.name}</TableCell>
                  <TableCell>
                    {selectedBrokerage.website ? (
                      <a 
                        href={selectedBrokerage.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {selectedBrokerage.website}
                      </a>
                    ) : '-'}
                  </TableCell>
                  <TableCell>{selectedBrokerage.brokerage_type || '-'}</TableCell>
                  <TableCell>
                    {format(new Date(selectedBrokerage.created_at), 'dd MMM yyyy HH:mm:ss')}
                  </TableCell>
                  <TableCell>
                    {format(new Date(selectedBrokerage.updated_at), 'dd MMM yyyy HH:mm:ss')}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-800"
                      onClick={(e) => {
                        e.stopPropagation();
                        setBrokerageToDelete(selectedBrokerage.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ) : !brokerages?.data?.length ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    No brokerages available
                  </TableCell>
                </TableRow>
              ) : (
                brokerages.data.map((brokerage: Brokerage) => (
                  <TableRow 
                    key={brokerage.id} 
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleRowClick(brokerage.id)}
                  >
                    <TableCell>{brokerage.id}</TableCell>
                    <TableCell>{brokerage.name}</TableCell>
                    <TableCell>
                      {brokerage.website ? (
                        <a 
                          href={brokerage.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {brokerage.website}
                        </a>
                      ) : '-'}
                    </TableCell>
                    <TableCell>{brokerage.brokerage_type || '-'}</TableCell>
                    <TableCell>
                      {format(new Date(brokerage.created_at), 'dd MMM yyyy HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      {format(new Date(brokerage.updated_at), 'dd MMM yyyy HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-800"
                        onClick={(e) => {
                          e.stopPropagation();
                          setBrokerageToDelete(brokerage.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <AlertDialog open={!!brokerageToDelete} onOpenChange={() => setBrokerageToDelete(null)}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the brokerage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => brokerageToDelete && handleDelete(brokerageToDelete)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <AlertDialogContent className="bg-white max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Create New Brokerage</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={createFormData.name}
                onChange={(e) => setCreateFormData(prev => ({...prev, name: e.target.value}))}
                placeholder="e.g. Binance"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Website</label>
              <Input
                value={createFormData.website}
                onChange={(e) => setCreateFormData(prev => ({...prev, website: e.target.value}))}
                placeholder="e.g. https://www.binance.com/en"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Registration Link</label>
              <Input
                value={createFormData.registration_link}
                onChange={(e) => setCreateFormData(prev => ({...prev, registration_link: e.target.value}))}
                placeholder="e.g. https://accounts.binance.com/register"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                value={createFormData.description}
                onChange={(e) => setCreateFormData(prev => ({...prev, description: e.target.value}))}
                placeholder="Enter brokerage description"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Color Code</label>
              <div className="flex items-center gap-3">
                <Select
                  value={createFormData.color_code}
                  onValueChange={(value) => setCreateFormData(prev => ({...prev, color_code: value}))}
                >
                  <SelectTrigger className="w-full flex items-center gap-2">
                    {createFormData.color_code && (
                      <div 
                        className="w-4 h-4 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: createFormData.color_code }} 
                      />
                    )}
                    <SelectValue placeholder="Select a color" />
                  </SelectTrigger>
                  <SelectContent>
                    {COLOR_OPTIONS.map((color) => (
                      <SelectItem 
                        key={color.value} 
                        value={color.value}
                      >
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: color.value }} 
                          />
                        <span>{color.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div 
                  className="w-10 h-10 rounded-md flex-shrink-0"
                  style={{ 
                    backgroundColor: createFormData.color_code || '#ffffff',
                    border: '1px solid #e2e8f0',
                    boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)'
                  }} 
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
    Select a predefined color for the brokerage theme
  </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Brokerage Type</label>
              <Input
                value={createFormData.brokerage_type}
                onChange={(e) => setCreateFormData(prev => ({...prev, brokerage_type: e.target.value}))}
                placeholder="e.g. crypto"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">API Base URL</label>
              <Input
                value={createFormData.api_base_url}
                onChange={(e) => setCreateFormData(prev => ({...prev, api_base_url: e.target.value}))}
                placeholder="e.g. https://api.binance.com"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCreate}
              className="bg-[#4A1C24] text-white hover:bg-[#3A161C]"
            >
              Create
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}