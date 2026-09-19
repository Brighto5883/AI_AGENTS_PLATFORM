import { Link } from "react-router-dom";
import type { Listing, WantedPost } from "@/types";
import { Badge } from "@/components/Common";

export function ListingCard({ listing }: { listing: Listing }) { const image=listing.images[0]?.url; return <Link className="listing-card" to={`/marketplace/listings/${listing.id}`}><div className="listing-image">{image?<img src={image} alt={listing.title}/>:<span>No image</span>}</div><div className="listing-body"><Badge>{listing.category}</Badge><h3>{listing.title}</h3><div className="price">KSh {listing.price}</div><p>{new Date(listing.created_at).toLocaleDateString("en-KE",{day:"numeric",month:"short",year:"numeric"})}</p></div></Link>; }
export function WantedCard({ post }: { post: WantedPost }) { return <Link className="wanted-card" to={`/marketplace/wanted/${post.id}`}><div className="card-row"><h3>{post.title}</h3><Badge>{post.category}</Badge></div><p>{post.description}</p><strong>{post.budget ? `Budget: KSh ${post.budget}` : "No budget set"}</strong></Link>; }
