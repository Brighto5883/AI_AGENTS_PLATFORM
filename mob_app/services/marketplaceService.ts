import { Platform } from "react-native";
import { File as ExpoFile } from "expo-file-system";
import { apiFetch } from "@/services/api";
import type { 
  Listing, ListingFilters, ListingsResponse,
  WantedPost, WantedPostCreateInput,
        } from "@/types/marketplace";

        //====================================================================================
type CreateListingInput = {
  title: string;
  description: string;
  price: string;
  category: string;
  images: {
    uri: string;
    fileName?: string | null;
    mimeType?: string;
    file?: globalThis.File;
  }[];
};

export async function createListing(
  input: CreateListingInput
): Promise<Listing> {
  const formData = new FormData();

  formData.append("title", input.title);
  formData.append("description", input.description);
  formData.append("price", input.price);
  formData.append("category", input.category);

  for (const image of input.images) {
    if (Platform.OS === "web") {
      if (!image.file) {
        throw new Error("Selected image file is unavailable.");
      }
  
      formData.append("images", image.file);
    } else {
      const file = new ExpoFile(image.uri);

      formData.append("images", file);
    }
  }

  const response = await apiFetch(
    "/marketplace/listings/", 
    {
      method: "POST",
      body: formData,
    });

  if (!response.ok) {
    const errorBody = await response.text();
  
    console.error(
      "Create listing failed:",
      response.status,
      errorBody
    );
  
    throw new Error(
      `Failed to create listing: ${response.status} ${errorBody}`
    );
  }

  return response.json();
}
//=========================================================================================
export async function getListings(
  filters: ListingFilters = {}
): Promise<ListingsResponse> {
  const params = new URLSearchParams();

  if (filters.search) {
    params.set("search", filters.search);
  }

  if (filters.category) {
    params.set("category", filters.category);
  }

  if (filters.min_price !== undefined) {
    params.set("min_price", String(filters.min_price));
  }

  if (filters.max_price !== undefined) {
    params.set("max_price", String(filters.max_price));
  }

  if (filters.sort) {
    params.set("sort", filters.sort);
  }

  if (filters.limit !== undefined) {
    params.set("limit", String(filters.limit));
  }

  if (filters.offset !== undefined) {
    params.set("offset", String(filters.offset));
  }

  const query = params.toString();

  const response = await apiFetch(
    `/marketplace/listings/${query ? `?${query}` : ""}`, 
    {
      method: "GET",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch marketplace listings: ${response.status}`
    );
  }

  return response.json();
}
// ===================================================================================
export async function getListing(
  listingId: string
): Promise<Listing> {
  const response = await apiFetch(
    `/marketplace/listings/${listingId}`,
    {
      method: "GET",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch listing: ${response.status}`
    );
  }

  return response.json();
}

//====================================================================================
export async function getMyListings(): Promise<Listing[]> {
  const response = await apiFetch("/marketplace/listings/my-listings");

  if (!response.ok) {
    throw new Error("Failed to fetch your listings.");
  }

  return response.json();
}

//====================================================================================
export async function updateListing(
  listingId: string,
  input: {
    title?: string;
    description?: string;
    price?: string;
    category?: string;
  },
): Promise<Listing> {
  const response = await apiFetch(
    `/marketplace/listings/${listingId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();

    console.error(
      "Update listing failed:",
      response.status,
      errorBody,
    );

    throw new Error(
      `Failed to update listing: ${response.status} ${errorBody}`,
    );
  }

  return response.json();
}

//====================================================================================
export async function addListingImages(
  listingId: string,
  images: {
    uri: string;
    fileName?: string | null;
    mimeType?: string;
    file?: globalThis.File;
  }[],
): Promise<Listing> {
  if (images.length === 0) {
    throw new Error("No images selected.");
  }

  const formData = new FormData();

  for (const image of images) {
    if (Platform.OS === "web") {
      if (!image.file) {
        throw new Error("Selected image file is unavailable.");
      }

      formData.append("images", image.file);
    } else {
      const file = new ExpoFile(image.uri);

      formData.append("images", file);
    }
  }

  const response = await apiFetch(
    `/marketplace/listings/${listingId}/images`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();

    console.error(
      "Add listing images failed:",
      response.status,
      errorBody,
    );

    throw new Error(
      `Failed to add listing images: ${response.status} ${errorBody}`,
    );
  }

  return response.json();
}

//====================================================================================
export async function deleteListingImage(
  listingId: string,
  imageId: string,
): Promise<void> {
  const response = await apiFetch(
    `/marketplace/listings/${listingId}/images/${imageId}`,
    {
      method: "DELETE",
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();

    console.error(
      "Delete listing image failed:",
      response.status,
      errorBody,
    );

    throw new Error(
      `Failed to delete listing image: ${response.status} ${errorBody}`,
    );
  }
}

//====================================================================================
export async function markListingSold(
  listingId: string,
): Promise<Listing> {
  const response = await apiFetch(
    `/marketplace/listings/${listingId}/sold`,
    {
      method: "PATCH",
    },
  );

  if (!response.ok) {
    throw new Error("Failed to mark listing as sold.");
  }

  return response.json();
}

//====================================================================================
export async function deleteListing(
  listingId: string,
): Promise<void> {
  const response = await apiFetch(
    `/marketplace/listings/${listingId}`,
    {
      method: "DELETE",
    },
  );

  if (!response.ok) {
    throw new Error("Failed to delete listing.");
  }
}

//====================================================================================
             // WANTED POSTS 
//====================================================================================

export async function createWantedPost(
  data: WantedPostCreateInput
): Promise<WantedPost> {
  const response = await apiFetch(
    `/marketplace/wanted/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  const responseText = await response.text();



  if (!response.ok) {
    throw new Error(responseText);
  }

  return JSON.parse(responseText);
}

//====================================================================================
export async function getWantedPosts(): Promise<WantedPost[]> {
  const response = await apiFetch(
    `/marketplace/wanted/`,
    {
      method: "GET",
    }
  );

  return response.json();
}

//====================================================================================
export async function getWantedPost(wantedId: string): Promise<WantedPost> {
  const response = await apiFetch(
    `/marketplace/wanted/${wantedId}`,
    {
      method: "GET",
    }
  );

  return response.json()
}

//====================================================================================
export async function getMyWantedPosts(): Promise<WantedPost[]> {
  const response = await apiFetch("/marketplace/wanted/my-posts");

  if (!response.ok) {
    throw new Error("Failed to fetch your wanted posts.");
  }

  return response.json();
}

//====================================================================================

export async function updateWantedPost(
  wantedId: string,
  input: {
    title?: string;
    description?: string;
    category?: string;
    budget?: string;
  },
): Promise<WantedPost> {
  const response = await apiFetch(
    `/marketplace/wanted/${wantedId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...input,
        budget:
          input.budget?.trim() === ""
            ? null
            : input.budget !== undefined
              ? Number(input.budget)
              : undefined,
      }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();

    console.error(
      "Update wanted post failed:",
      response.status,
      errorBody,
    );

    throw new Error(
      `Failed to update wanted post: ${response.status} ${errorBody}`,
    );
  }

  return response.json();
}


//====================================================================================
export async function markWantedPostFulfilled(
  wantedId: string,
): Promise<WantedPost> {
  const response = await apiFetch(
    `/marketplace/wanted/${wantedId}/fulfilled`,
    {
      method: "PATCH",
    },
  );

  if (!response.ok) {
    throw new Error("Failed to mark wanted post as fulfilled.");
  }

  return response.json();
}

//====================================================================================
export async function deleteWantedPost(
  wantedId: string,
): Promise<void> {
  const response = await apiFetch(
    `/marketplace/wanted/${wantedId}`,
    {
      method: "DELETE",
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();

    console.error(
      "Delete wanted post failed:",
      response.status,
      errorBody,
    );

    throw new Error(
      `Failed to delete wanted post: ${response.status} ${errorBody}`,
    );
  }
}

//====================================================================================
// MARKETPLACE BILLING
//====================================================================================

export async function getMarketplaceBillingInfo(): Promise<import("@/types/billing").MarketplaceBillingInfo> {
  const response = await apiFetch("/marketplace/billing/info", {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch marketplace billing information: ${response.status}`);
  }

  return response.json();
}
