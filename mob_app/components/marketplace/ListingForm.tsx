
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import PhoneNumberField from "@/components/marketplace/PhoneNumberField";
import { deleteListingImage } from "@/services/marketplaceService";
import {
  categories,
  ListingImage,
  MarketplaceCategory,
} from "@/types/marketplace";


const MAX_LISTING_IMAGES = 5;

type ListingFormImage = {
  uri: string;
  fileName?: string | null;
  mimeType?: string;
  file?: ImagePicker.ImagePickerAsset["file"];
};

export type ListingFormSubmitData = {
  title: string;
  description: string;
  price: string;
  category: MarketplaceCategory;
  phone: string;
  images: ListingFormImage[];
};

type ListingFormProps = {
  listingId?: string;
  initialTitle?: string;
  initialDescription?: string;
  initialPrice?: string;
  initialCategory?: MarketplaceCategory;
  initialPhone?: string;
  initialImages?: ListingImage[];
  submitLabel?: string;
  submittingLabel?: string;
  isSubmitting?: boolean;
  onSubmit: (data: ListingFormSubmitData) => Promise<void>;
};

export default function ListingForm({
  listingId,
  initialTitle = "",
  initialDescription = "",
  initialPrice = "",
  initialCategory,
  initialPhone = "",
  initialImages = [],
  submitLabel = "Submit Listing",
  submittingLabel = "Submitting listing...",
  isSubmitting = false,
  onSubmit,
}: ListingFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [price, setPrice] = useState(initialPrice);
  const [category, setCategory] = useState<MarketplaceCategory | "">(
    initialCategory ?? "",
  );

  const [existingImages, setExistingImages] =
    useState<ListingImage[]>(initialImages);

  const [images, setImages] = useState<
    ImagePicker.ImagePickerAsset[]
  >([]);

  const [phone, setPhone] = useState(initialPhone ?? "");

  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(
    null,
  );

  const totalImages = existingImages.length + images.length;

  const handleSubmit = async () => {
    setError(null);
    setPhoneError(null);

    if (!title.trim()) {
      setError("Please enter a title.");
      return;
    }

    if (!description.trim()) {
      setError("Please enter a description.");
      return;
    }

    if (!price.trim()) {
      setError("Please enter a price.");
      return;
    }

    if (!category) {
      setError("Please select a category.");
      return;
    }

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        price: price.trim(),
        category,
        phone: phone.trim(),
        images: images.map((image) => ({
          uri: image.uri,
          fileName: image.fileName,
          mimeType: image.mimeType,
          file: image.file,
        })),
      });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to submit listing.",
      );
    }
  };

  const pickImages = async () => {
    const remainingSlots = MAX_LISTING_IMAGES - totalImages;

    if (remainingSlots <= 0) {
      setError(`You can have at most ${MAX_LISTING_IMAGES} images.`);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: remainingSlots,
      quality: 1,
    });

    if (!result.canceled) {
      setImages((currentImages) => {
        const combinedImages = [
          ...currentImages,
          ...result.assets,
        ];

        return combinedImages.slice(0, remainingSlots);
      });
    }
  };

  const handleDeleteExistingImage = async (
    image: ListingImage,
  ) => {
    if (!listingId) {
      setError("Unable to delete this image.");
      return;
    }

    setError(null);
    setDeletingImageId(image.id);

    try {
      await deleteListingImage(listingId, image.id);

      setExistingImages((currentImages) =>
        currentImages.filter(
          (currentImage) => currentImage.id !== image.id,
        ),
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete image.",
      );
    } finally {
      setDeletingImageId(null);
    }
  };

  return (
    <View className="gap-5">
      {/* Title */}
      <View>
        <Text className="mb-2 text-sm font-semibold text-gray-800">
          Title
        </Text>

        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Samsung A15 128GB"
          placeholderTextColor="#9ca3af"
          className="rounded-2xl border border-gray-200 bg-white px-4 py-4 text-base text-gray-950"
        />
      </View>

      {/* Description */}
      <View>
        <Text className="mb-2 text-sm font-semibold text-gray-800">
          Description
        </Text>

        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the item..."
          placeholderTextColor="#9ca3af"
          multiline
          textAlignVertical="top"
          className="min-h-32 rounded-2xl border border-gray-200 bg-white px-4 py-4 text-base text-gray-950"
        />
      </View>

      {/* Price */}
      <View>
        <Text className="mb-2 text-sm font-semibold text-gray-800">
          Price
        </Text>

        <TextInput
          value={price}
          onChangeText={setPrice}
          placeholder="e.g. 25000"
          placeholderTextColor="#9ca3af"
          keyboardType="decimal-pad"
          className="rounded-2xl border border-gray-200 bg-white px-4 py-4 text-base text-gray-950"
        />
      </View>

      {/* Category */}
      <View>
        <Text className="mb-2 text-sm font-semibold text-gray-800">
          Category
        </Text>

        <Pressable
          onPress={() => setIsCategoryOpen(true)}
          className="rounded-2xl border border-gray-200 bg-white px-4 py-4"
        >
          <Text
            className={
              category
                ? "text-base text-gray-950"
                : "text-base text-gray-400"
            }
          >
            {category || "Select a category"}
          </Text>
        </Pressable>
      </View>

      {/* Phone */}
      <PhoneNumberField
        value={phone}
        onChange={setPhone}
        hasStoredNumber={Boolean(initialPhone)}
        error={phoneError}
      />

      {/* Photos */}
      <View>
        <Text className="mb-2 text-sm font-semibold text-gray-800">
          Photos
        </Text>

        <Pressable
          onPress={pickImages}
          disabled={totalImages >= MAX_LISTING_IMAGES}
          className="items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-6"
          style={({ pressed }) => ({
            opacity:
              pressed || totalImages >= MAX_LISTING_IMAGES ? 0.6 : 1,
          })}
        >
          <Text className="text-base font-bold text-gray-900">
            {totalImages > 0
              ? "Add more photos"
              : "Add photos"}
          </Text>

          <Text className="mt-1 text-sm text-gray-500">
          Select up to {MAX_LISTING_IMAGES} images: {totalImages}/{MAX_LISTING_IMAGES} selected
          </Text>
        </Pressable>

        {totalImages > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-3"
          >
            {/* Existing images */}
            {existingImages.map((image) => {
              const isDeleting =
                deletingImageId === image.id;

              return (
                <View
                  key={image.id}
                  className="mr-3"
                >
                  <Image
                    source={{ uri: image.url }}
                    className="h-24 w-24 rounded-xl"
                    resizeMode="cover"
                  />

                  <Pressable
                    onPress={() =>
                      handleDeleteExistingImage(image)
                    }
                    disabled={isDeleting}
                    className="absolute right-1 top-1 h-7 w-7 items-center justify-center rounded-full bg-black/70"
                  >
                    <Text className="font-bold text-white">
                      {isDeleting ? "…" : "×"}
                    </Text>
                  </Pressable>
                </View>
              );
            })}

            {/* Newly selected images */}
            {images.map((image, index) => (
              <View
                key={image.assetId ?? image.uri}
                className="mr-3"
              >
                <Image
                  source={{ uri: image.uri }}
                  className="h-24 w-24 rounded-xl"
                  resizeMode="cover"
                />

                <Pressable
                  onPress={() => {
                    setImages((currentImages) =>
                      currentImages.filter(
                        (_, imageIndex) =>
                          imageIndex !== index,
                      ),
                    );
                  }}
                  className="absolute right-1 top-1 h-7 w-7 items-center justify-center rounded-full bg-black/70"
                >
                  <Text className="font-bold text-white">
                    ×
                  </Text>
                </Pressable>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Error + Submit */}
      <View>
        {error && (
          <Text className="text-sm font-medium text-red-500">
            {error}
          </Text>
        )}

        <Pressable
          onPress={handleSubmit}
          disabled={isSubmitting}
          className="mt-3 rounded-2xl bg-gray-950 p-4"
          style={({ pressed }) => ({
            opacity:
              pressed || isSubmitting ? 0.7 : 1,
          })}
        >
          <Text className="text-center text-base font-bold text-white">
            {isSubmitting
              ? submittingLabel
              : submitLabel}
          </Text>
        </Pressable>
      </View>

      {/* Category Modal */}
      <Modal
        visible={isCategoryOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCategoryOpen(false)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/40"
          onPress={() => setIsCategoryOpen(false)}
        >
          <Pressable
            className="rounded-t-3xl bg-white p-5"
            onPress={(event) =>
              event.stopPropagation()
            }
          >
            <Text className="mb-4 text-xl font-bold text-gray-950">
              Select category
            </Text>

            {categories.map((item) => (
              <Pressable
                key={item}
                onPress={() => {
                  setCategory(item);
                  setIsCategoryOpen(false);
                }}
                className="border-b border-gray-100 py-4"
              >
                <Text className="text-base text-gray-900">
                  {item}
                </Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
