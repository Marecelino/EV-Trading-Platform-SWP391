// src/components/modules/ImageGallery/ImageGallery.tsx
import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Thumbs } from "swiper/modules";
import type { Swiper as SwiperInstance } from "swiper";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/thumbs";
import "./ImageGallery.scss";

interface ImageGalleryProps {
  images: string[];
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images }) => {
  const [thumbsSwiper, setThumbsSwiper] = React.useState<SwiperInstance | null>(
    null
  );

  console.log("ImageGallery: Received images:", images);
  console.log("ImageGallery: Images length:", images?.length);

  if (!images || images.length === 0) {
    return (
      <div className="image-gallery">
        <div className="no-images">
          <p>Không có hình ảnh sản phẩm</p>
        </div>
      </div>
    );
  }

  return (
    <div className="image-gallery">
      <Swiper
        modules={[Navigation, Thumbs]}
        spaceBetween={10}
        navigation
        thumbs={{
          swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null,
        }}
        className="main-swiper"
      >
        {images.map((img, index) => (
          <SwiperSlide key={index}>
            <img
              src={img}
              alt={`Product image ${index + 1}`}
              onError={(e) => {
                console.error("ImageGallery: Failed to load image:", img);
                e.currentTarget.style.display = "none";
              }}
              onLoad={() => {
                console.log("ImageGallery: Successfully loaded image:", img);
              }}
            />
          </SwiperSlide>
        ))}
      </Swiper>
      <Swiper
        onSwiper={setThumbsSwiper}
        modules={[Thumbs]}
        spaceBetween={10}
        slidesPerView={5}
        watchSlidesProgress
        className="thumbs-swiper"
      >
        {images.map((img, index) => (
          <SwiperSlide key={index}>
            <img
              src={img}
              alt={`Thumbnail ${index + 1}`}
              onError={(e) => {
                console.error("ImageGallery: Failed to load thumbnail:", img);
                e.currentTarget.style.display = "none";
              }}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};
export default ImageGallery;
