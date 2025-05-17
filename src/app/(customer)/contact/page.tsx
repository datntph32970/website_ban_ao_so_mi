import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, Phone, MapPin } from "lucide-react"
import { Facebook } from "lucide-react"


export default function StoreInfoPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card className="shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">🏬 THÔNG TIN CỬA HÀNG</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Tên cửa hàng</h2>
            <p>FIFTY STORE</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Địa chỉ</h2>
            <p className="flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Trịnh Văn Bô, Xuân Phương, Nam Từ Liêm, Hà Nội
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Số điện thoại</h2>
            <p className="flex items-center gap-2">
              <Phone className="w-4 h-4" /> 1900 xxxx
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Email</h2>
            <p className="flex items-center gap-2">
              <Mail className="w-4 h-4" /> support@fiftystore.com
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Mạng xã hội</h2>
            <p className="flex items-center gap-2">
            <Facebook className="w-4 h-4" />
    <a
      href="https://www.facebook.com/profile.php?id=61576264940151"
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 hover:underline"
    >
      FIFTY STORE
    </a>
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Giờ làm việc</h2>
            <ul className="list-disc list-inside">
              <li>Thứ 2 - Thứ 7: 8:00 - 21:00</li>
              <li>Chủ nhật: 9:00 - 18:00</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Bản đồ</h2>
            <div className="aspect-video rounded-xl overflow-hidden border">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14894.909353884801!2d105.7378049112916!3d21.0435931664642!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x313455e940879933%3A0xcf10b34e9f1a03df!2zVHLGsOG7nW5nIENhbyDEkeG6s25nIEZQVCBQb2x5dGVjaG5pYw!5e0!3m2!1svi!2s!4v1747413043533!5m2!1svi!2s"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>

          <Button className="w-full">Liên hệ ngay</Button>
        </CardContent>
      </Card>
    </div>
  )
}
