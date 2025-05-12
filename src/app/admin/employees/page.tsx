"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, Plus, Search, Trash, Phone, Mail, Calendar, MapPin, CreditCard, User, ChevronDown, Filter, CheckCircle, AlertCircle, Pencil } from "lucide-react";
import { NhanVien, ChucVu } from "@/types/nhan-vien";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { nhanVienService } from "@/services/nhan-vien.service";
import toast from 'react-hot-toast';
import { AccessDenied } from "@/components/ui/access-denied";
import { useRouter } from "next/navigation";
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface FilterOptions {
  trang_thai: string;
  vai_tro: string;
  gioi_tinh: string;
  ngay_tao_tu: string;
  ngay_tao_den: string;
}

type SortField = 'ma_nhan_vien' | 'ten_nhan_vien' | 'vai_tro' | 'ngay_tao' | 'trang_thai';
type SortOrder = 'asc' | 'desc';

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<NhanVien[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<NhanVien[]>([]);
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<NhanVien | null>(null);
  const [isViewEmployeeOpen, setIsViewEmployeeOpen] = useState(false);
  const [isTechnicalDetailsOpen, setIsTechnicalDetailsOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>('ngay_tao');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    trang_thai: "all",
    vai_tro: "all",
    gioi_tinh: "all",
    ngay_tao_tu: "",
    ngay_tao_den: "",
  });
  const [hasAccess, setHasAccess] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedRole, setEditedRole] = useState<ChucVu | null>(null);
  const [editedStatus, setEditedStatus] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Nếu đang sắp xếp theo trường này, đảo ngược thứ tự
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Nếu chọn trường mới, sắp xếp giảm dần mặc định
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Lọc và sắp xếp nhân viên
  const filteredAndSortedEmployees = (searchTerm ? searchResults : employees)
    .filter(employee => {
      // Lọc theo từ khóa tìm kiếm
      const searchMatch = 
        employee.ten_nhan_vien.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.ma_nhan_vien.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase());

      // Lọc theo trạng thái
      const statusMatch = filterOptions.trang_thai === "all" || employee.trang_thai === filterOptions.trang_thai;

      // Lọc theo vai trò
      const roleMatch = filterOptions.vai_tro === "all" || employee.taiKhoanNhanVien?.chuc_vu === filterOptions.vai_tro;

      // Lọc theo giới tính
      const genderMatch = filterOptions.gioi_tinh === "all" || employee.gioi_tinh === filterOptions.gioi_tinh;

      // Lọc theo khoảng thời gian
      const dateMatch = (!filterOptions.ngay_tao_tu || !filterOptions.ngay_tao_den) || (
        new Date(employee.ngay_tao) >= new Date(filterOptions.ngay_tao_tu) &&
        new Date(employee.ngay_tao) <= new Date(filterOptions.ngay_tao_den)
      );

      return searchMatch && statusMatch && roleMatch && genderMatch && dateMatch;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'ma_nhan_vien':
          comparison = a.ma_nhan_vien.localeCompare(b.ma_nhan_vien);
          break;
        case 'ten_nhan_vien':
          comparison = a.ten_nhan_vien.localeCompare(b.ten_nhan_vien);
          break;
        case 'vai_tro':
          comparison = (a.taiKhoanNhanVien?.chuc_vu || '').localeCompare(b.taiKhoanNhanVien?.chuc_vu || '');
          break;
        case 'ngay_tao':
          comparison = new Date(a.ngay_tao).getTime() - new Date(b.ngay_tao).getTime();
          break;
        case 'trang_thai':
          comparison = a.trang_thai.localeCompare(b.trang_thai);
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilterOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetFilters = () => {
    setFilterOptions({
      trang_thai: "all",
      vai_tro: "all",
      gioi_tinh: "all",
      ngay_tao_tu: "",
      ngay_tao_den: "",
    });
  };

  const handleRowClick = (employee: NhanVien) => {
    setSelectedEmployee(employee);
    setIsViewEmployeeOpen(true);
  };

  // Fetch danh sách nhân viên
  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      const data = await nhanVienService.getDanhSachNhanVien();
      setEmployees(data);
      // Nếu đang trong trạng thái tìm kiếm, cập nhật lại kết quả tìm kiếm
      if (searchTerm) {
        const results = await nhanVienService.timKiemNhanVien(searchTerm);
        setSearchResults(results);
      }
      setHasAccess(true);
    } catch (error: any) {
      console.error("Lỗi khi lấy danh sách nhân viên:", error);
      if (error.response?.status === 403) {
        setHasAccess(false);
        toast.error("Bạn không có quyền truy cập vào trang này");
      } else {
        toast.error("Không thể lấy danh sách nhân viên. Vui lòng thử lại sau.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Load danh sách nhân viên khi component mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Xử lý xóa nhân viên
  const handleDeleteEmployee = async (id: string) => {
    try {
      const response = await nhanVienService.xoaNhanVien({ id_nhan_vien: id });
      if (response.status === 200) {
        await fetchEmployees(); // Cập nhật lại cả danh sách và kết quả tìm kiếm
        toast.success("Xóa nhân viên thành công");
        setIsViewEmployeeOpen(false);
      } else {
        toast.error(typeof response.data === 'string' ? response.data : "Không thể xóa nhân viên");
      }
    } catch (error: any) {
      console.error("Lỗi khi xóa nhân viên:", error);
      toast.error(typeof error.response?.data === 'string' ? error.response.data : "Không thể xóa nhân viên. Vui lòng thử lại sau.");
    }
  };

  const handleEditRole = async (employeeId: string, newRole: ChucVu) => {
    try {
      setIsLoading(true);
      await nhanVienService.capNhatChucVu(employeeId, newRole);
      await fetchEmployees(); // Cập nhật lại cả danh sách và kết quả tìm kiếm
      toast.success('Cập nhật chức vụ thành công');
      setIsEditDialogOpen(false);
    } catch (error) {
      toast.error('Không thể cập nhật chức vụ');
      console.error('Error updating role:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditStatus = async (employeeId: string, newStatus: string) => {
    try {
      setIsLoading(true);
      await nhanVienService.capNhatTrangThai(employeeId, newStatus);
      await fetchEmployees(); // Cập nhật lại cả danh sách và kết quả tìm kiếm
      toast.success('Cập nhật trạng thái thành công');
      setIsEditDialogOpen(false);
    } catch (error) {
      toast.error('Không thể cập nhật trạng thái');
      console.error('Error updating status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedEmployee) return;
    
    try {
      setIsLoading(true);
      const response = await nhanVienService.capNhatChucVuVaTrangThai({
        id_nhan_vien: selectedEmployee.id_nhan_vien,
        chuc_vu: editedRole || undefined,
        trang_thai: editedStatus === 'Hoạt động' ? 'HoatDong' : editedStatus === 'Không hoạt động' ? 'KhongHoatDong' : undefined
      });
      
      if (response.status === 200) {
        await fetchEmployees(); // Cập nhật lại cả danh sách và kết quả tìm kiếm
        toast.success('Cập nhật thông tin thành công');
        setIsEditDialogOpen(false);
        setEditedRole(null);
        setEditedStatus(null);
      } else {
        toast.error('Cập nhật thất bại');
      }
    } catch (error: any) {
      console.error('Error updating information:', error);
      toast.error(error.response?.data || 'Không thể cập nhật thông tin');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenEditDialog = (employee: NhanVien) => {
    setSelectedEmployee(employee);
    setEditedRole(null);
    setEditedStatus(null);
    setIsEditDialogOpen(true);
  };

  // Hàm tìm kiếm nhân viên
  const handleSearch = async (keyword: string) => {
    if (!keyword.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const results = await nhanVienService.timKiemNhanVien(keyword);
      setSearchResults(results);
    } catch (error: any) {
      console.error("Lỗi khi tìm kiếm:", error);
      toast.error("Không thể tìm kiếm nhân viên. Vui lòng thử lại sau.");
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce search với thời gian dài hơn
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim()) {
        handleSearch(searchTerm);
      } else {
        setSearchResults([]);
      }
    }, 800); // Tăng thời gian debounce lên 800ms

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Hiển thị danh sách nhân viên đã lọc và sắp xếp
  const displayedEmployees = filteredAndSortedEmployees;

  // Tính toán phân trang
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = displayedEmployees.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(displayedEmployees.length / itemsPerPage);

  // Hàm chuyển trang
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  if (!hasAccess) {
    return <AccessDenied />;
  }

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Quản lý nhân viên</h1>
          <p className="text-slate-500">Quản lý danh sách nhân viên cửa hàng bán giày</p>
        </div>
        <Button 
          className="flex items-center gap-2"
          onClick={() => router.push("/admin/employees/add")}
        >
          <Plus className="h-4 w-4" />
          <span>Thêm nhân viên</span>
        </Button>
      </div>

      <div className="mb-6 flex space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            className="pl-10"
            placeholder="Tìm kiếm nhân viên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
            </div>
          )}
          {searchTerm && !isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-slate-500">
              {searchResults.length} kết quả
            </div>
          )}
        </div>
        <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span>Lọc</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Lọc nhân viên</DialogTitle>
              <DialogDescription>Chọn các tiêu chí để lọc danh sách nhân viên</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Trạng thái</Label>
                <Select
                  value={filterOptions.trang_thai}
                  onValueChange={(value) => handleFilterChange('trang_thai', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="HoatDong">Đang làm việc</SelectItem>
                    <SelectItem value="KhongHoatDong">Đã nghỉ việc</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Vai trò</Label>
                <Select
                  value={filterOptions.vai_tro}
                  onValueChange={(value) => handleFilterChange('vai_tro', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn vai trò" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="Admin">Quản lý cửa hàng</SelectItem>
                    <SelectItem value="NhanVien">Nhân viên</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Giới tính</Label>
                <Select
                  value={filterOptions.gioi_tinh}
                  onValueChange={(value) => handleFilterChange('gioi_tinh', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn giới tính" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="Nam">Nam</SelectItem>
                    <SelectItem value="Nữ">Nữ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Khoảng thời gian tạo</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Từ ngày</Label>
                    <Input
                      type="date"
                      value={filterOptions.ngay_tao_tu}
                      onChange={(e) => handleFilterChange('ngay_tao_tu', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Đến ngày</Label>
                    <Input
                      type="date"
                      value={filterOptions.ngay_tao_den}
                      onChange={(e) => handleFilterChange('ngay_tao_den', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={resetFilters}>Đặt lại</Button>
              <Button onClick={() => setIsFilterOpen(false)}>Áp dụng</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="w-[100px] cursor-pointer hover:bg-slate-50"
                onClick={() => handleSort('ma_nhan_vien')}
              >
                Mã NV
              </TableHead>
              <TableHead 
                className="w-[250px] cursor-pointer hover:bg-slate-50"
                onClick={() => handleSort('ten_nhan_vien')}
              >
                Nhân viên
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-slate-50"
                onClick={() => handleSort('vai_tro')}
              >
                Vai trò
              </TableHead>
              <TableHead>Liên hệ</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-slate-50"
                onClick={() => handleSort('ngay_tao')}
              >
                Ngày tạo
              </TableHead>
              <TableHead 
                className="text-center cursor-pointer hover:bg-slate-50"
                onClick={() => handleSort('trang_thai')}
              >
                Trạng thái
              </TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : displayedEmployees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-slate-500">
                  {searchTerm ? "Không tìm thấy nhân viên nào phù hợp" : "Không có nhân viên nào"}
                </TableCell>
              </TableRow>
            ) : (
              currentItems.map((employee) => (
                <TableRow 
                  key={employee.id_nhan_vien}
                  className="cursor-pointer hover:bg-slate-50"
                  onClick={() => handleRowClick(employee)}
                >
                  <TableCell className="font-medium">{employee.ma_nhan_vien}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {employee.ten_nhan_vien.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{employee.ten_nhan_vien}</p>
                        <p className="text-xs text-slate-500">{employee.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      employee.taiKhoanNhanVien?.chuc_vu === 'Admin' 
                        ? "bg-purple-100 text-purple-800" 
                        : "bg-blue-100 text-blue-800"
                    }`}>
                      {employee.taiKhoanNhanVien?.chuc_vu === 'Admin' ? 'Quản trị viên' : 'Nhân viên'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-3 w-3 text-slate-500" />
                        <span>{employee.so_dien_thoai}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-3 w-3 text-slate-500" />
                        <span>{employee.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{new Date(employee.ngay_tao).toLocaleDateString('vi-VN')}</TableCell>
                  <TableCell className="text-center">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      employee.trang_thai === 'HoatDong' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                      {employee.trang_thai === 'HoatDong' ? 'Hoạt động' : 'Không hoạt động'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button 
                        size="icon" 
                        variant="ghost"
                        className="hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition-colors duration-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditDialog(employee);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Phân trang */}
      {!isLoading && displayedEmployees.length > 0 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-slate-500">
            Hiển thị {indexOfFirstItem + 1} đến {Math.min(indexOfLastItem, displayedEmployees.length)} trong tổng số {displayedEmployees.length} nhân viên
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Trước
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(page)}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Sau
            </Button>
          </div>
        </div>
      )}

      {/* Dialog hiển thị thông tin chi tiết nhân viên */}
      <Dialog open={isViewEmployeeOpen} onOpenChange={setIsViewEmployeeOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Thông tin chi tiết nhân viên</DialogTitle>
            <DialogDescription className="text-base">Xem thông tin chi tiết về nhân viên</DialogDescription>
          </DialogHeader>

          {selectedEmployee && (
            <div className="grid gap-6 py-4">
              {/* Header section with avatar and basic info */}
              <div className="flex items-start gap-6 p-4 bg-slate-50 rounded-lg">
                <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    {selectedEmployee.ten_nhan_vien.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">{selectedEmployee.ten_nhan_vien}</h3>
                      <p className="text-slate-500 mt-1">{selectedEmployee.taiKhoanNhanVien?.chuc_vu === 'Admin' ? 'Quản trị viên' : 'Nhân viên'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedEmployee.trang_thai === 'HoatDong' 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {selectedEmployee.trang_thai === 'HoatDong' ? 'Đang làm việc' : 'Đã nghỉ việc'}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="h-4 w-4" />
                      <span>{selectedEmployee.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="h-4 w-4" />
                      <span>{selectedEmployee.so_dien_thoai}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main content section */}
              <div className="grid grid-cols-2 gap-8">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg text-slate-900 border-b pb-2">Thông tin cá nhân</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-slate-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-slate-500">Mã nhân viên</p>
                        <p className="font-medium">{selectedEmployee.ma_nhan_vien}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-slate-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-slate-500">Ngày sinh</p>
                        <p className="font-medium">{new Date(selectedEmployee.ngay_sinh).toLocaleDateString('vi-VN')}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-slate-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-slate-500">Giới tính</p>
                        <p className="font-medium">{selectedEmployee.gioi_tinh}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CreditCard className="h-5 w-5 text-slate-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-slate-500">CCCD</p>
                        <p className="font-medium">{selectedEmployee.cccd}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg text-slate-900 border-b pb-2">Thông tin bổ sung</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-slate-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-slate-500">Địa chỉ</p>
                        <p className="font-medium">{selectedEmployee.dia_chi}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-slate-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-slate-500">Ngày tạo</p>
                        <p className="font-medium">{new Date(selectedEmployee.ngay_tao).toLocaleDateString('vi-VN')}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-slate-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-slate-500">Tài khoản</p>
                        <p className="font-medium">{selectedEmployee.taiKhoanNhanVien?.ten_dang_nhap}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-slate-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-slate-500">Vai trò</p>
                        <p className="font-medium">{selectedEmployee.taiKhoanNhanVien?.chuc_vu === 'Admin' ? 'Quản trị viên' : 'Nhân viên'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Details Section */}
              <div className="border-t pt-4">
                <button
                  onClick={() => setIsTechnicalDetailsOpen(!isTechnicalDetailsOpen)}
                  className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors group"
                  tabIndex={-1}
                >
                  <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full group-hover:bg-slate-200 transition-colors">
                    <ChevronDown 
                      className={`h-4 w-4 transition-transform duration-200 ${isTechnicalDetailsOpen ? 'rotate-180' : ''}`}
                    />
                    <span className="font-medium text-sm">Thông tin kỹ thuật</span>
                  </div>
                </button>

                {isTechnicalDetailsOpen && (
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-6">
                      {/* System IDs */}
                      <div className="bg-white rounded-lg border p-4 space-y-4">
                        <h4 className="font-medium text-slate-900 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                          Thông tin hệ thống
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="w-32">
                              <p className="text-sm text-slate-500">ID Nhân viên</p>
                            </div>
                            <div className="flex-1">
                              <p className="font-mono text-sm bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200">
                                {selectedEmployee.id_nhan_vien}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-32">
                              <p className="text-sm text-slate-500">ID Tài khoản</p>
                            </div>
                            <div className="flex-1">
                              <p className="font-mono text-sm bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200">
                                {selectedEmployee.id_tai_khoan}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-32">
                              <p className="text-sm text-slate-500">ID Người tạo</p>
                            </div>
                            <div className="flex-1">
                              <p className="font-mono text-sm bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200">
                                {selectedEmployee.id_nguoi_tao}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Timestamps */}
                      <div className="bg-white rounded-lg border p-4 space-y-4">
                        <h4 className="font-medium text-slate-900 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                          Thông tin thời gian
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="w-32">
                              <p className="text-sm text-slate-500">Ngày tạo</p>
                            </div>
                            <div className="flex-1">
                              <p className="font-mono text-sm bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200">
                                {new Date(selectedEmployee.ngay_tao).toLocaleString('vi-VN', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-32">
                              <p className="text-sm text-slate-500">Ngày sửa</p>
                            </div>
                            <div className="flex-1">
                              <p className="font-mono text-sm bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200">
                                {selectedEmployee.ngay_sua 
                                  ? new Date(selectedEmployee.ngay_sua).toLocaleString('vi-VN', {
                                      year: 'numeric',
                                      month: '2-digit',
                                      day: '2-digit',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })
                                  : 'Chưa có thay đổi'
                                }
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-32">
                              <p className="text-sm text-slate-500">Trạng thái TK</p>
                            </div>
                            <div className="flex-1">
                              <p className="font-mono text-sm bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200">
                                {selectedEmployee.taiKhoanNhanVien?.trang_thai == 'HoatDong' ? 'Hoạt động' : 'Không hoạt động'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="mt-6">
            <div className="flex items-center gap-2 w-full">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="bg-red-500 hover:bg-red-600 text-white flex items-center gap-2"
                  >
                    <Trash className="h-4 w-4" />
                    Xóa
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Xác nhận xóa nhân viên</AlertDialogTitle>
                    <AlertDialogDescription>
                      Bạn có chắc chắn muốn xóa nhân viên này? Hành động này không thể hoàn tác.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDeleteEmployee(selectedEmployee!.id_nhan_vien)}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      Xóa
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className={`${
                      selectedEmployee && selectedEmployee.trang_thai === 'HoatDong' 
                        ? 'bg-green-500 hover:bg-green-600' 
                        : 'bg-yellow-500 hover:bg-yellow-600'
                    } text-white flex items-center gap-2`}
                  >
                    {selectedEmployee && selectedEmployee.trang_thai === 'HoatDong' ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Đang hoạt động
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4" />
                        Không hoạt động
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {selectedEmployee && selectedEmployee.trang_thai === 'HoatDong' 
                        ? 'Xác nhận vô hiệu hóa nhân viên' 
                        : 'Xác nhận kích hoạt nhân viên'}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {selectedEmployee && selectedEmployee.trang_thai === 'HoatDong'
                        ? 'Bạn có chắc chắn muốn vô hiệu hóa nhân viên này?'
                        : 'Bạn có chắc chắn muốn kích hoạt nhân viên này?'}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => {
                        if (!selectedEmployee) return;
                        try {
                          const newStatus = selectedEmployee.trang_thai === 'HoatDong' ? 'KhongHoatDong' : 'HoatDong';
                          await nhanVienService.capNhatChucVuVaTrangThai({
                            id_nhan_vien: selectedEmployee.id_nhan_vien,
                            trang_thai: newStatus
                          });
                          await fetchEmployees();
                          toast.success('Cập nhật trạng thái thành công');
                          setIsViewEmployeeOpen(false);
                        } catch (error: any) {
                          console.error('Error updating status:', error);
                          toast.error(error.response?.data || 'Không thể cập nhật trạng thái');
                        }
                      }}
                      className={`${
                        selectedEmployee && selectedEmployee.trang_thai === 'HoatDong'
                          ? 'bg-red-500 hover:bg-red-600'
                          : 'bg-green-500 hover:bg-green-600'
                      }`}
                    >
                      {selectedEmployee && selectedEmployee.trang_thai === 'HoatDong' ? 'Vô hiệu hóa' : 'Kích hoạt'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button variant="outline" onClick={() => setIsViewEmployeeOpen(false)} className="ml-auto">
                Đóng
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Chỉnh sửa thông tin nhân viên</DialogTitle>
            <DialogDescription className="text-base">
              Cập nhật thông tin và quyền hạn của nhân viên
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
              <Avatar className="h-16 w-16 border-4 border-white shadow-lg">
                <AvatarFallback className="text-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  {selectedEmployee?.ten_nhan_vien.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{selectedEmployee?.ten_nhan_vien}</h3>
                <p className="text-sm text-slate-500">{selectedEmployee?.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-500" />
                  Chức vụ
                </Label>
                <Select
                  defaultValue={selectedEmployee?.taiKhoanNhanVien?.chuc_vu}
                  onValueChange={(value) => setEditedRole(value as ChucVu)}
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-full h-11 bg-white border-slate-200 hover:border-slate-300 transition-colors">
                    <SelectValue placeholder="Chọn chức vụ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem 
                      value={ChucVu.ADMIN} 
                      className="flex items-center gap-3 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-500" />
                        <span className="font-medium">Admin</span>
                      </div>
                      <span className="text-xs text-slate-500 ml-auto">Quản trị viên hệ thống</span>
                    </SelectItem>
                    <SelectItem 
                      value={ChucVu.NHAN_VIEN} 
                      className="flex items-center gap-3 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="font-medium">Nhân viên</span>
                      </div>
                      <span className="text-xs text-slate-500 ml-auto">Nhân viên thông thường</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-500" />
                  Trạng thái
                </Label>
                <Select
                  defaultValue={selectedEmployee?.trang_thai === 'HoatDong' ? 'Hoạt động' : 'Không hoạt động'}
                  onValueChange={(value) => setEditedStatus(value)}
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-full h-11 bg-white border-slate-200 hover:border-slate-300 transition-colors">
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem 
                      value="Hoạt động" 
                      className="flex items-center gap-3 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="font-medium">Hoạt động</span>
                      </div>
                      <span className="text-xs text-slate-500 ml-auto">Đang làm việc</span>
                    </SelectItem>
                    <SelectItem 
                      value="Không hoạt động" 
                      className="flex items-center gap-3 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="font-medium">Không hoạt động</span>
                      </div>
                      <span className="text-xs text-slate-500 ml-auto">Đã nghỉ việc</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Hủy
            </Button>
            <Button 
              className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              disabled={isLoading || (!editedRole && !editedStatus)}
              onClick={handleSaveChanges}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Đang cập nhật...</span>
                </div>
              ) : (
                'Lưu thay đổi'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
