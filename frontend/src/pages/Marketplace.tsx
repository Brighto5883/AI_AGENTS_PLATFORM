import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { Page } from "@/components/Layout";
import {
  Badge,
  Empty,
  ErrorState,
  FormField,
  Loading,
} from "@/components/Common";
import { Feedback } from "@/components/Feedback";
import { ListingCard, WantedCard } from "@/components/MarketplaceCards";
import { PaymentModal } from "@/components/PaymentModal";
import { useAuth } from "@/context/AuthContext";
import {
  addListingImages,
  connectListing,
  connectWanted,
  createListing,
  createWanted,
  deleteListing,
  deleteWanted,
  fulfillWanted,
  getBilling,
  getListing,
  getListings,
  getMyListings,
  getMyWanted,
  getWanted,
  getWantedPost,
  markListingSold,
  updateListing,
  updateWanted,
  updateMe,
} from "@/services/apiServices";
import {
  categories,
  type BillingInfo,
  type Listing,
  type ListingSort,
  type MarketplaceCategory,
  type Transaction,
  type WantedPost,
} from "@/types";

/* -------------------------------------------------------------------------- */
/* Marketplace home                                                          */
/* -------------------------------------------------------------------------- */

export function MarketplaceHome() {
  const [items, setItems] = useState<Listing[]>([]);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<MarketplaceCategory | "">("");
  const [sort, setSort] = useState<ListingSort>("recent");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState("");
  const [billing, setBilling] = useState<BillingInfo | null>(null);

  async function load(reset = true) {
    setLoading(true);
    setError("");

    try {
      const response = await getListings({
        search: query || undefined,
        category: category || undefined,
        sort,
        min_price: min ? Number(min) : undefined,
        max_price: max ? Number(max) : undefined,
        limit: 20,
        offset: reset ? 0 : offset,
      });

      setItems((current) =>
        reset ? response.items : [...current, ...response.items],
      );
      setOffset(response.next_offset);
      setMore(response.has_more);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Couldn't load marketplace.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getBilling()
      .then(setBilling)
      .catch(() => undefined);

    void load(true);
  }, [query, category, sort, min, max]);

  return (
    <Page
      title="Marketplace"
      eyebrow="KU MARKETPLACE"
      action={
        <div className="page-actions">
          <Link
            className="button dark"
            to="/marketplace/listings/create"
          >
            Sell Something
          </Link>

          <Link
            className="button ghost"
            to="/marketplace/wanted/create"
          >
            Post what you require
          </Link>
        </div>
      }
    >
      <div className="market-nav">
        <Link to="/marketplace">Buy &amp; sell</Link>
        <Link to="/marketplace/wanted">Required by buyers</Link>
        <Link to="/marketplace/my-marketplace">My posts</Link>
      </div>

      {billing && (
        <div className="notice compact">
          <div>
            <Badge tone="warning">Marketplace billing</Badge>
            <p>{billing.notice_message}</p>
          </div>
        </div>
      )}

      <div className="market-toolbar">
        <form
          className="search-form"
          onSubmit={(event) => {
            event.preventDefault();
            setQuery(search.trim());
          }}
        >
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search listings..."
          />

          <button className="button dark" type="submit">
            Search
          </button>
        </form>

        <div className="filter-row">
          <select
            value={category}
            onChange={(event) =>
              setCategory(
                event.target.value as MarketplaceCategory | "",
              )
            }
          >
            <option value="">All categories</option>

            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <input
            placeholder="Min KSh"
            value={min}
            onChange={(event) => setMin(event.target.value)}
            inputMode="numeric"
          />

          <input
            placeholder="Max KSh"
            value={max}
            onChange={(event) => setMax(event.target.value)}
            inputMode="numeric"
          />

          <select
            value={sort}
            onChange={(event) =>
              setSort(event.target.value as ListingSort)
            }
          >
            <option value="recent">Recent</option>
            <option value="price_asc">Lowest price</option>
            <option value="price_desc">Highest price</option>
          </select>
        </div>
      </div>

      {error ? (
        <ErrorState
          message={error}
          onRetry={() => void load(true)}
        />
      ) : loading ? (
        <Loading label="Loading marketplace..." />
      ) : items.length === 0 ? (
        <Empty
          title="No listings found"
          text="Try another search or clear your filters."
        />
      ) : (
        <>
          <div className="listing-grid">
            {items.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
              />
            ))}
          </div>

          {more && (
            <div className="center">
              <button
                className="button ghost"
                onClick={() => {
                  setLoading(true);
                  void load(false);
                }}
              >
                Load more
              </button>
            </div>
          )}
        </>
      )}
    </Page>
  );
}

/* -------------------------------------------------------------------------- */
/* Wanted posts                                                               */
/* -------------------------------------------------------------------------- */

export function WantedPage() {
  const [posts, setPosts] = useState<WantedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      setPosts(await getWanted());
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Couldn't load requests.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <Page
      title="What students need"
      eyebrow="WANTED POSTS"
      action={
        <Link
          className="button dark"
          to="/marketplace/wanted/create"
        >
          Post a request
        </Link>
      }
    >
      <div className="market-nav">
        <Link to="/marketplace">For sale</Link>
        <Link
          className="active"
          to="/marketplace/wanted"
        >
          Required by buyers
        </Link>
        <Link to="/marketplace/my-marketplace">My posts</Link>
      </div>

      {error ? (
        <ErrorState
          message={error}
          onRetry={() => void load()}
        />
      ) : loading ? (
        <Loading />
      ) : posts.length === 0 ? (
        <Empty
          title="No open requests"
          text="Be the first to post what you need."
        />
      ) : (
        <div className="wanted-grid">
          {posts.map((post) => (
            <WantedCard
              key={post.id}
              post={post}
            />
          ))}
        </div>
      )}
    </Page>
  );
}

/* -------------------------------------------------------------------------- */
/* Marketplace form                                                          */
/* -------------------------------------------------------------------------- */

function phoneValid(phone: string) {
  return /^(?:\+?254|0)7\d{8}$/.test(
    phone.replace(/\s|-/g, ""),
  );
}

function MarketplaceForm({
  mode,
  listing,
  wanted,
}: {
  mode: "listing" | "wanted";
  listing?: Listing;
  wanted?: WantedPost;
}) {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const [title, setTitle] = useState(
    listing?.title || wanted?.title || "",
  );

  const [description, setDescription] = useState(
    listing?.description || wanted?.description || "",
  );

  const [price, setPrice] = useState(
    listing?.price || "",
  );

  const [budget, setBudget] = useState(
    wanted?.budget || "",
  );

  const [category, setCategory] =
    useState<MarketplaceCategory>(
      (listing?.category ||
        wanted?.category ||
        categories[0]) as MarketplaceCategory,
    );

  const [phone, setPhone] = useState(
    user?.phone || "",
  );

  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (!title.trim() || !description.trim()) {
      setError("Title and description are required.");
      return;
    }

    if (!phoneValid(phone)) {
      setError("Enter a valid Kenyan phone number.");
      return;
    }

    if (
      mode === "listing" &&
      !listing &&
      (!price || Number(price) <= 0)
    ) {
      setError("Enter a valid price.");
      return;
    }

    if (
      mode === "wanted" &&
      budget &&
      Number(budget) <= 0
    ) {
      setError("Enter a valid budget.");
      return;
    }

    setBusy(true);

    try {
      const normalizedPhone = phone.replace(
        /\s|-/g,
        "",
      );

      if (normalizedPhone !== user?.phone) {
        await updateMe({
          phone: phone.trim(),
        });

        await refreshUser();
      }

      if (mode === "listing") {
        if (listing) {
          const updated = await updateListing(
            listing.id,
            {
              title,
              description,
              price,
              category,
            },
          );

          if (files.length > 0) {
            await addListingImages(
              listing.id,
              files,
            );
          }

          void updated;
        } else {
          await createListing({
            title,
            description,
            price,
            category,
            images: files,
          });
        }

        navigate("/marketplace/my-marketplace");
      } else {
        if (wanted) {
          await updateWanted(
            wanted.id,
            {
              title,
              description,
              category,
              budget,
            },
          );
        } else {
          await createWanted({
            title,
            description,
            category,
            budget: budget
              ? Number(budget)
              : undefined,
          });
        }

        navigate("/marketplace/my-marketplace");
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not save your post.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className="form-card wide-form"
      onSubmit={submit}
    >
      <div className="form-grid">
        <FormField label="Title">
          <input
            value={title}
            onChange={(event) =>
              setTitle(event.target.value)
            }
            placeholder={
              mode === "listing"
                ? "e.g. Samsung Galaxy A15"
                : "e.g. Looking for a laptop"
            }
          />
        </FormField>

        <FormField label="Category">
          <select
            value={category}
            onChange={(event) =>
              setCategory(
                event.target
                  .value as MarketplaceCategory,
              )
            }
          >
            {categories.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ))}
          </select>
        </FormField>

        {mode === "listing" ? (
          <FormField label="Price (KSh)">
            <input
              type="number"
              min="1"
              value={price}
              onChange={(event) =>
                setPrice(event.target.value)
              }
            />
          </FormField>
        ) : (
          <FormField
            label="Budget (KSh)"
            hint="Optional"
          >
            <input
              type="number"
              min="1"
              value={budget}
              onChange={(event) =>
                setBudget(event.target.value)
              }
            />
          </FormField>
        )}

        <FormField
          label="WhatsApp / phone"
          hint="Used for marketplace contact. You can change it here."
        >
          <input
            value={phone}
            onChange={(event) =>
              setPhone(event.target.value)
            }
            placeholder="07XX XXX XXX"
          />
        </FormField>
      </div>

      <FormField label="Description">
        <textarea
          rows={7}
          value={description}
          onChange={(event) =>
            setDescription(event.target.value)
          }
          placeholder="Give the campus community enough detail..."
        />
      </FormField>

      {mode === "listing" && !listing && (
        <FormField
          label="Photos"
          hint="Optional. Select up to 5 images."
        >
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(event) =>
              setFiles(
                Array.from(
                  event.target.files || [],
                ).slice(0, 5),
              )
            }
          />

          {files.length > 0 && (
            <small>
              {files.length} photo(s) selected.
            </small>
          )}
        </FormField>
      )}

      {error && (
        <p className="form-error">
          {error}
        </p>
      )}

      <div className="form-actions">
        <Link
          className="button ghost"
          to="/marketplace"
        >
          Cancel
        </Link>

        <button
          className="button dark"
          disabled={busy}
          type="submit"
        >
          {busy
            ? listing || wanted
              ? "Saving..."
              : "Publishing..."
            : listing || wanted
              ? "Save changes"
              : mode === "listing"
                ? "Create listing"
                : "Post request"}
        </button>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Create / edit pages                                                        */
/* -------------------------------------------------------------------------- */

export function CreateListing() {
  return (
    <Page
      title="Sell something"
      eyebrow="KU MARKETPLACE"
    >
      <p className="lead">
        Create a listing and make it available
        to the campus community.
      </p>

      <MarketplaceForm mode="listing" />
    </Page>
  );
}

export function CreateWanted() {
  return (
    <Page
      title="Find something"
      eyebrow="KU MARKETPLACE"
    >
      <p className="lead">
        Tell the campus community what you are
        looking for.
      </p>

      <MarketplaceForm mode="wanted" />
    </Page>
  );
}

export function EditListing() {
  const { id } = useParams();
  const [listing, setListing] =
    useState<Listing | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      return;
    }

    getListing(id)
      .then(setListing)
      .catch((error) =>
        setError(
          error instanceof Error
            ? error.message
            : "Couldn't load listing.",
        ),
      );
  }, [id]);

  return (
    <Page
      title="Edit listing"
      eyebrow="MY MARKETPLACE"
    >
      {error ? (
        <ErrorState message={error} />
      ) : !listing ? (
        <Loading />
      ) : (
        <MarketplaceForm
          mode="listing"
          listing={listing}
        />
      )}
    </Page>
  );
}

export function EditWanted() {
  const { id } = useParams();
  const [wanted, setWanted] =
    useState<WantedPost | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      return;
    }

    getWantedPost(id)
      .then(setWanted)
      .catch((error) =>
        setError(
          error instanceof Error
            ? error.message
            : "Couldn't load request.",
        ),
      );
  }, [id]);

  return (
    <Page
      title="Edit request"
      eyebrow="MY MARKETPLACE"
    >
      {error ? (
        <ErrorState message={error} />
      ) : !wanted ? (
        <Loading />
      ) : (
        <MarketplaceForm
          mode="wanted"
          wanted={wanted}
        />
      )}
    </Page>
  );
}

/* -------------------------------------------------------------------------- */
/* My marketplace                                                             */
/* -------------------------------------------------------------------------- */

export function MyMarketplace() {
  const [listings, setListings] =
    useState<Listing[]>([]);
  const [wanted, setWanted] =
    useState<WantedPost[]>([]);
  const [tab, setTab] =
    useState<"listings" | "wanted">("listings");
  const [loading, setLoading] =
    useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const [myListings, myWanted] =
        await Promise.all([
          getMyListings(),
          getMyWanted(),
        ]);

      setListings(myListings);
      setWanted(myWanted);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Couldn't load your marketplace.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function sold(id: string) {
    if (
      !confirm(
        "Mark this listing as sold? It will disappear publicly and be permanently deleted after 7 days.",
      )
    ) {
      return;
    }

    try {
      const updated = await markListingSold(id);

      setListings((current) =>
        current.map((item) =>
          item.id === id ? updated : item,
        ),
      );
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Couldn't mark listing as sold.",
      );
    }
  }

  async function del(id: string) {
    if (
      !confirm(
        "Permanently delete this listing?",
      )
    ) {
      return;
    }

    try {
      await deleteListing(id);

      setListings((current) =>
        current.filter(
          (item) => item.id !== id,
        ),
      );
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Couldn't delete listing.",
      );
    }
  }

  async function fulfill(id: string) {
    if (
      !confirm(
        "Mark this request as fulfilled?",
      )
    ) {
      return;
    }

    try {
      const updated =
        await fulfillWanted(id);

      setWanted((current) =>
        current.map((item) =>
          item.id === id ? updated : item,
        ),
      );
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Couldn't fulfill request.",
      );
    }
  }

  async function delWanted(id: string) {
    if (
      !confirm(
        "Permanently delete this request?",
      )
    ) {
      return;
    }

    try {
      await deleteWanted(id);

      setWanted((current) =>
        current.filter(
          (item) => item.id !== id,
        ),
      );
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Couldn't delete request.",
      );
    }
  }

  return (
    <Page
      title="My Marketplace"
      eyebrow="YOUR POSTS"
      action={
        <div className="page-actions">
          <Link
            className="button dark"
            to="/marketplace/listings/create"
          >
            Sell something
          </Link>

          <Link
            className="button ghost"
            to="/marketplace/wanted/create"
          >
            Post a request
          </Link>
        </div>
      }
    >
      {error ? (
        <ErrorState
          message={error}
          onRetry={() => void load()}
        />
      ) : loading ? (
        <Loading />
      ) : (
        <>
          <div className="tabs">
            <button
              className={
                tab === "listings"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setTab("listings")
              }
            >
              For sale ({listings.length})
            </button>

            <button
              className={
                tab === "wanted"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setTab("wanted")
              }
            >
              Wanted ({wanted.length})
            </button>
          </div>

          {tab === "listings" ? (
            listings.length ? (
              <div className="manage-list">
                {listings.map((listing) => (
                  <div
                    className="manage-card"
                    key={listing.id}
                  >
                    <div className="manage-image">
                      {listing.images[0] ? (
                        <img
                          src={
                            listing.images[0].url
                          }
                          alt=""
                        />
                      ) : (
                        <span>No image</span>
                      )}
                    </div>

                    <div className="manage-info">
                      <div className="card-row">
                        <div>
                          <Badge
                            tone={
                              listing.is_active
                                ? "success"
                                : "warning"
                            }
                          >
                            {listing.is_active
                              ? "Live"
                              : "Sold"}
                          </Badge>

                          <h3>
                            {listing.title}
                          </h3>

                          <p>
                            KSh {listing.price} ·{" "}
                            {listing.category}
                          </p>
                        </div>

                        <div className="manage-actions">
                          <Link
                            className="button ghost small"
                            to={`/marketplace/listings/${listing.id}/edit`}
                          >
                            Edit
                          </Link>

                          {listing.is_active && (
                            <button
                              className="button ghost small"
                              onClick={() =>
                                void sold(
                                  listing.id,
                                )
                              }
                            >
                              Mark sold
                            </button>
                          )}

                          <button
                            className="button danger small"
                            onClick={() =>
                              void del(
                                listing.id,
                              )
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {!listing.is_active &&
                        listing.scheduled_deletion_at && (
                          <small>
                            Scheduled for permanent
                            deletion on{" "}
                            {new Date(
                              listing.scheduled_deletion_at,
                            ).toLocaleDateString(
                              "en-KE",
                            )}
                          </small>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty
                title="No listings yet"
                text="Your items for sale will appear here."
              />
            )
          ) : wanted.length ? (
            <div className="manage-list">
              {wanted.map((post) => (
                <div
                  className="manage-card compact-manage"
                  key={post.id}
                >
                  <div className="manage-info">
                    <div className="card-row">
                      <div>
                        <Badge
                          tone={
                            post.is_open
                              ? "success"
                              : "warning"
                          }
                        >
                          {post.is_open
                            ? "Open"
                            : "Fulfilled"}
                        </Badge>

                        <h3>{post.title}</h3>

                        <p>
                          {post.category} ·{" "}
                          {post.budget
                            ? `Budget KSh ${post.budget}`
                            : "No budget"}
                        </p>
                      </div>

                      <div className="manage-actions">
                        <Link
                          className="button ghost small"
                          to={`/marketplace/wanted/${post.id}/edit`}
                        >
                          Edit
                        </Link>

                        {post.is_open && (
                          <button
                            className="button ghost small"
                            onClick={() =>
                              void fulfill(
                                post.id,
                              )
                            }
                          >
                            Fulfill
                          </button>
                        )}

                        <button
                          className="button danger small"
                          onClick={() =>
                            void delWanted(
                              post.id,
                            )
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty
              title="No requests yet"
              text="Post what you need and let the community respond."
            />
          )}
        </>
      )}
    </Page>
  );
}

/* -------------------------------------------------------------------------- */
/* Contact buttons                                                            */
/* -------------------------------------------------------------------------- */

function ContactButtons({
  phone,
  title,
}: {
  phone: string | null;
  title: string;
}) {
  if (!phone) {
    return (
      <div className="muted-box">
        This user hasn't added a contact
        number yet.
      </div>
    );
  }

  const clean = phone.replace(/\D/g, "");

  const message = encodeURIComponent(
    `Hi, I saw your post "${title}" on Campus Hub.`,
  );

  return (
    <div className="contact-actions">
      <a
        className="button whatsapp"
        target="_blank"
        rel="noreferrer"
        href={`https://wa.me/${clean}?text=${message}`}
      >
        Message on WhatsApp
      </a>

      <a
        className="button dark"
        href={`tel:${phone}`}
      >
        Call {phone}
      </a>

      <a
        className="text-link"
        href={`sms:${phone}`}
      >
        Or send an SMS
      </a>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Listing detail                                                             */
/* -------------------------------------------------------------------------- */

export function ListingDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [listing, setListing] =
    useState<Listing | null>(null);
  const [error, setError] = useState("");
  const [image, setImage] = useState(0);
  const [transaction, setTransaction] =
    useState<Transaction | null>(null);
  const [paymentOpen, setPaymentOpen] =
    useState(false);
  const [unlocking, setUnlocking] =
    useState(false);

  useEffect(() => {
    if (!id) {
      return;
    }

    getListing(id)
      .then(setListing)
      .catch((error) =>
        setError(
          error instanceof Error
            ? error.message
            : "Couldn't load listing.",
        ),
      );
  }, [id]);

  if (error) {
    return (
      <Page title="Listing">
        <ErrorState message={error} />
      </Page>
    );
  }

  if (!listing) {
    return (
      <Page title="Listing">
        <Loading label="Loading listing..." />
      </Page>
    );
  }

  /*
   * Keep a stable reference after the null check.
   * TypeScript cannot always preserve the narrowing
   * of `listing` inside nested functions.
   */
  const currentListing = listing;

  const own =
    user?.id === currentListing.seller_id;

  async function unlock() {
    if (!user?.phone) {
      alert(
        "Add your phone number to your account before making a connection payment.",
      );
      return;
    }

    setUnlocking(true);

    try {
      const transaction =
        await connectListing(
          currentListing.id,
        );

      setTransaction(transaction);
      setPaymentOpen(true);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Couldn't create connection.",
      );
    } finally {
      setUnlocking(false);
    }
  }

  return (
    <Page
      title={currentListing.title}
      eyebrow={currentListing.category}
    >
      <div className="detail-layout">
        <div>
          <div className="detail-main-image">
            {currentListing.images[image] ? (
              <img
                src={
                  currentListing.images[image].url
                }
                alt={currentListing.title}
              />
            ) : (
              <span>No images</span>
            )}
          </div>

          {currentListing.images.length > 1 && (
            <div className="thumbs">
              {currentListing.images.map(
                (item, index) => (
                  <button
                    className={
                      index === image
                        ? "selected"
                        : ""
                    }
                    key={item.id}
                    onClick={() =>
                      setImage(index)
                    }
                  >
                    <img
                      src={item.url}
                      alt=""
                    />
                  </button>
                ),
              )}
            </div>
          )}
        </div>

        <div className="detail-info">
          <div className="price huge">
            KSh {currentListing.price}
          </div>

          <p className="lead">
            {currentListing.description}
          </p>

          {own ? (
            <div className="notice compact">
              <strong>
                This is your listing.
              </strong>

              <p>
                Manage it from My Marketplace.
              </p>

              <Link
                className="button ghost small"
                to="/marketplace/my-marketplace"
              >
                Manage post
              </Link>
            </div>
          ) : currentListing.contact_unlocked ? (
            <ContactButtons
              phone={
                currentListing.seller.phone
              }
              title={currentListing.title}
            />
          ) : (
            <div className="locked">
              <strong>
                Contact is locked.
              </strong>

              <p>
                Complete the connection payment
                to unlock this contact.
              </p>

              <button
                className="button dark full"
                disabled={unlocking}
                onClick={() =>
                  void unlock()
                }
              >
                {unlocking
                  ? "Starting payment..."
                  : "Unlock contact"}
              </button>
            </div>
          )}

          <div className="seller-card">
            <span className="eyebrow">
              SELLER
            </span>

            <h3>
              {currentListing.seller.name ||
                "KU Marketplace Seller"}
            </h3>

            <p>
              Posted{" "}
              {new Date(
                currentListing.created_at,
              ).toLocaleDateString("en-KE")}
            </p>
          </div>

          <div className="report">
            <strong>
              Something wrong with this listing?
            </strong>

            <p>
              Report a problem or give feedback.
            </p>

            <Feedback screen="marketplace_listing" />
          </div>
        </div>
      </div>

      {paymentOpen && transaction && (
        <PaymentModal
          transaction={transaction}
          phone={user?.phone || ""}
          onClose={() =>
            setPaymentOpen(false)
          }
          onSuccess={() => {
            setPaymentOpen(false);

            if (id) {
              getListing(id).then(setListing);
            }
          }}
        />
      )}
    </Page>
  );
}

/* -------------------------------------------------------------------------- */
/* Wanted detail                                                              */
/* -------------------------------------------------------------------------- */

export function WantedDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [post, setPost] =
    useState<WantedPost | null>(null);
  const [error, setError] = useState("");
  const [transaction, setTransaction] =
    useState<Transaction | null>(null);
  const [pay, setPay] = useState(false);

  useEffect(() => {
    if (!id) {
      return;
    }

    getWantedPost(id)
      .then(setPost)
      .catch((error) =>
        setError(
          error instanceof Error
            ? error.message
            : "Couldn't load request.",
        ),
      );
  }, [id]);

  if (error) {
    return (
      <Page title="Request">
        <ErrorState message={error} />
      </Page>
    );
  }

  if (!post) {
    return (
      <Page title="Request">
        <Loading />
      </Page>
    );
  }

  /*
   * Same narrowing fix as ListingDetail.
   */
  const currentPost = post;

  const own =
    user?.id === currentPost.requester_id;

  async function unlock() {
    if (!user?.phone) {
      alert(
        "Add your phone number to your account first.",
      );
      return;
    }

    try {
      const transaction =
        await connectWanted(
          currentPost.id,
        );

      setTransaction(transaction);
      setPay(true);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Couldn't create connection.",
      );
    }
  }

  return (
    <Page
      title={currentPost.title}
      eyebrow={currentPost.category}
    >
      <div className="detail-layout one-column">
        <div className="detail-info">
          <div className="price">
            {currentPost.budget
              ? `Budget: KSh ${currentPost.budget}`
              : "No budget set"}
          </div>

          <p className="lead">
            {currentPost.description}
          </p>

          {own ? (
            <div className="notice compact">
              <strong>
                This is your request.
              </strong>

              <Link
                className="button ghost small"
                to="/marketplace/my-marketplace"
              >
                Manage post
              </Link>
            </div>
          ) : currentPost.contact_unlocked ? (
            <ContactButtons
              phone={
                currentPost.requester.phone
              }
              title={currentPost.title}
            />
          ) : (
            <div className="locked">
              <strong>
                Contact is locked.
              </strong>

              <p>
                Complete the connection payment
                to unlock the requester.
              </p>

              <button
                className="button dark full"
                onClick={() =>
                  void unlock()
                }
              >
                Unlock contact
              </button>
            </div>
          )}

          <div className="seller-card">
            <span className="eyebrow">
              REQUESTER
            </span>

            <h3>
              {currentPost.requester.name ||
                "KU Marketplace Member"}
            </h3>

            <p>
              Posted{" "}
              {new Date(
                currentPost.created_at,
              ).toLocaleDateString("en-KE")}
            </p>
          </div>
        </div>
      </div>

      {pay && transaction && (
        <PaymentModal
          transaction={transaction}
          phone={user?.phone || ""}
          onClose={() => setPay(false)}
          onSuccess={() => {
            setPay(false);

            if (id) {
              getWantedPost(id).then(setPost);
            }
          }}
        />
      )}
    </Page>
  );
}