import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFViewer,
  Image,
  Font
} from '@react-pdf/renderer';
import { format } from 'date-fns';

// Đăng ký font
Font.register({
  family: 'Roboto',
  src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf'
});

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    fontSize: 10,
    padding: 30,
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
    borderBottom: '1px solid black',
    paddingBottom: 10,
  },
  storeName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  storeInfo: {
    fontSize: 9,
    marginBottom: 2,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  invoiceInfo: {
    marginBottom: 15,
  },
  invoiceNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  infoGroup: {
    marginBottom: 15,
  },
  infoLabel: {
    fontSize: 9,
    marginRight: 5,
  },
  infoValue: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  table: {
    marginVertical: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'black',
    paddingBottom: 5,
    marginBottom: 5,
  },
  tableRow: {
    flexDirection: 'row',
    marginVertical: 3,
  },
  productCol: {
    flex: 2,
    paddingRight: 5,
  },
  qtyCol: {
    width: 40,
    textAlign: 'center',
  },
  priceCol: {
    flex: 1,
    textAlign: 'right',
  },
  totalCol: {
    flex: 1,
    textAlign: 'right',
  },
  productName: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  productVariant: {
    fontSize: 9,
  },
  summarySection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'black',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: 'black',
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  grandTotalValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  paymentSection: {
    marginTop: 10,
    paddingTop: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 9,
  },
});

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
};

export interface InvoicePDFProps {
  invoiceData: {
    thongTinCuaHang: {
      tenCuaHang: string;
      diaChi: string;
      dienThoai: string;
      website: string;
      email: string;
    };
    thongTinHoaDon: {
      soHoaDon: string;
      ngayLap: string;
      nhanVienBanHang: string;
      maNhanVien: string;
    };
    thongTinKhachHang: {
      tenKhachHang: string;
      maKhachHang: string;
      soDienThoai: string;
      diaChiGiaoHang: string;
    };
    chiTietHoaDon: Array<{
      tenSanPham: string;
      mauSac: string;
      kichCo: string;
      soLuong: number;
      donGia: number;
      giaSauGiamGia: number;
      thanhTien: number;
      maSPCT: string;
    }>;
    thongTinThanhToan: {
      tongTienHang: number;
      giamGia: number;
      tongThanhToan: number;
      phuongThucThanhToan: string;
      tienKhachTra: number;
      tienThua: number;
    };
    ghiChu: string;
  };
}

const InvoicePDF: React.FC<InvoicePDFProps> = ({ invoiceData }) => (
  <PDFViewer style={{ width: '100%', height: '80vh' }}>
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.storeName}>{invoiceData?.thongTinCuaHang?.tenCuaHang}</Text>
          <Text style={styles.storeInfo}>{invoiceData?.thongTinCuaHang?.website}</Text>
          <Text style={styles.storeInfo}>{invoiceData?.thongTinCuaHang?.email}</Text>
          <Text style={styles.storeInfo}>{invoiceData?.thongTinCuaHang?.diaChi}</Text>
          <Text style={styles.storeInfo}>ĐT: {invoiceData?.thongTinCuaHang?.dienThoai}</Text>
        </View>

        <Text style={styles.documentTitle}>HÓA ĐƠN BÁN HÀNG</Text>

        <View style={styles.invoiceInfo}>
          <Text style={styles.invoiceNumber}>Số HĐ: {invoiceData?.thongTinHoaDon?.soHoaDon}</Text>
          <Text>Ngày: {invoiceData?.thongTinHoaDon?.ngayLap}</Text>
        </View>

        <View style={styles.infoGroup}>
          <Text>
            <Text style={styles.infoLabel}>Nhân viên:</Text>
            <Text style={styles.infoValue}>{invoiceData?.thongTinHoaDon?.nhanVienBanHang}</Text>
          </Text>
          <Text>
            <Text style={styles.infoLabel}>Khách hàng:</Text>
            <Text style={styles.infoValue}>{invoiceData?.thongTinKhachHang?.tenKhachHang || 'Khách lẻ'}</Text>
          </Text>
          {invoiceData?.thongTinKhachHang?.soDienThoai && (
            <Text>
              <Text style={styles.infoLabel}>SĐT:</Text>
              <Text style={styles.infoValue}>{invoiceData.thongTinKhachHang.soDienThoai}</Text>
            </Text>
          )}
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.productCol}>Sản phẩm</Text>
            <Text style={styles.qtyCol}>SL</Text>
            <Text style={styles.priceCol}>Đơn giá</Text>
            <Text style={styles.totalCol}>Thành tiền</Text>
          </View>

          {(invoiceData?.chiTietHoaDon || []).map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={styles.productCol}>
                <Text style={styles.productName}>{item.tenSanPham}</Text>
                <Text style={styles.productVariant}>Mã SPCT: {item.maSPCT}</Text>
                <Text style={styles.productVariant}>{item.mauSac} - {item.kichCo}</Text>
              </View>
              <Text style={styles.qtyCol}>{item.soLuong}</Text>
              <View style={styles.priceCol}>
                {item.giaSauGiamGia < item.donGia ? (
                  <>
                    <Text style={{ fontSize: 8, textDecoration: 'line-through', color: '#666' }}>
                      {formatCurrency(item.donGia)}
                    </Text>
                    <Text>{formatCurrency(item.giaSauGiamGia)}</Text>
                  </>
                ) : (
                  <Text>{formatCurrency(item.donGia)}</Text>
                )}
              </View>
              <Text style={styles.totalCol}>{formatCurrency(item.thanhTien)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text>Tổng tiền hàng:</Text>
            <Text>{formatCurrency(invoiceData?.thongTinThanhToan?.tongTienHang || 0)}</Text>
          </View>
          {(invoiceData?.thongTinThanhToan?.giamGia || 0) > 0 && (
            <View style={styles.summaryRow}>
              <Text>Giảm giá:</Text>
              <Text>-{formatCurrency(invoiceData?.thongTinThanhToan?.giamGia)}</Text>
            </View>
          )}
          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalLabel}>Tổng thanh toán:</Text>
            <Text style={styles.grandTotalValue}>
              {formatCurrency(invoiceData?.thongTinThanhToan?.tongThanhToan || 0)}
            </Text>
          </View>
        </View>

        {(invoiceData?.thongTinThanhToan?.tienKhachTra || 0) > 0 && (
          <View style={styles.paymentSection}>
            <View style={styles.summaryRow}>
              <Text>Tiền khách trả:</Text>
              <Text style={styles.infoValue}>
                {formatCurrency(invoiceData.thongTinThanhToan.tienKhachTra)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text>Tiền thừa:</Text>
              <Text style={styles.infoValue}>
                {formatCurrency(invoiceData.thongTinThanhToan.tienThua || 0)}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={{ fontWeight: 'bold', marginBottom: 3 }}>Cảm ơn quý khách đã mua hàng!</Text>
          <Text>Hẹn gặp lại quý khách</Text>
        </View>
      </Page>
    </Document>
  </PDFViewer>
);

export default InvoicePDF;