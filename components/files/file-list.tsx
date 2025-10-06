"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, MoreVertical, Download, Eye, Trash2, FileText, ImageIcon, FileArchive, File } from "lucide-react"

const mockFiles = [
  {
    id: "1",
    name: "Project_Proposal.pdf",
    type: "document",
    size: "2.4 MB",
    uploadedBy: "John Doe",
    uploadedDate: "2025-10-05",
    category: "Projects",
  },
  {
    id: "2",
    name: "Employee_Contract.docx",
    type: "document",
    size: "156 KB",
    uploadedBy: "Sarah Chen",
    uploadedDate: "2025-10-04",
    category: "HR",
  },
  {
    id: "3",
    name: "Logo_Design.png",
    type: "image",
    size: "845 KB",
    uploadedBy: "Mike Chen",
    uploadedDate: "2025-10-03",
    category: "Design",
  },
  {
    id: "4",
    name: "Invoice_2025_001.pdf",
    type: "document",
    size: "324 KB",
    uploadedBy: "Emily Davis",
    uploadedDate: "2025-10-02",
    category: "Finance",
  },
  {
    id: "5",
    name: "Meeting_Notes.txt",
    type: "document",
    size: "12 KB",
    uploadedBy: "John Doe",
    uploadedDate: "2025-10-01",
    category: "General",
  },
]

export function FileList() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  const filteredFiles = mockFiles.filter((file) => {
    const matchesSearch =
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.category.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesTab = activeTab === "all" || file.type === activeTab

    return matchesSearch && matchesTab
  })

  const getFileIcon = (type: string) => {
    switch (type) {
      case "document":
        return <FileText className="h-4 w-4 text-blue-600" />
      case "image":
        return <ImageIcon className="h-4 w-4 text-purple-600" />
      case "archive":
        return <FileArchive className="h-4 w-4 text-orange-600" />
      default:
        return <File className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>All Files</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Files</TabsTrigger>
            <TabsTrigger value="document">Documents</TabsTrigger>
            <TabsTrigger value="image">Images</TabsTrigger>
            <TabsTrigger value="archive">Archives</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFiles.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getFileIcon(file.type)}
                        <span className="font-medium">{file.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{file.category}</Badge>
                    </TableCell>
                    <TableCell>{file.size}</TableCell>
                    <TableCell>{file.uploadedBy}</TableCell>
                    <TableCell>{new Date(file.uploadedDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
