## 9.7.10.4. Texture Instructions: tld4

### tld4

Perform a texture fetch of the 4-texel bilerp footprint.

**Syntax**

```
tld4.comp.2d.v4.dtype.f32    d[|p], [a, c] {, e} {, f};
tld4.comp.geom.v4.dtype.f32  d[|p], [a, b, c] {, e} {, f};  // explicit sampler

.comp  = { .r, .g, .b, .a };
.geom  = { .2d, .a2d, .cube, .acube };
.dtype = { .u32, .s32, .f32 };
```

**Description**

Texture fetch of the 4-texel bilerp footprint using a texture coordinate vector. The instruction loads the bilerp footprint from the texture named by operand a at coordinates given by operand c into vector destination d. The texture component fetched for each texel sample is specified by `.comp`. The four texel samples are placed into destination vector d in counter-clockwise order starting at lower left.

An optional texture sampler b may be specified. If no sampler is specified, the sampler behavior is a property of the named texture.

The optional destination predicate p is set to True if data from texture at specified coordinates is resident in memory, False otherwise. When optional destination predicate p is set to False, data loaded will be all zeros. Memory residency of Texture Data at specified coordinates is dependent on execution environment setup using Driver API calls, prior to kernel launch. Refer to Driver API documentation for more details including any system/implementation specific behavior.

An optional operand f may be specified for depth textures. Depth textures are special type of textures which hold data from the depth buffer. Depth buffer contains depth information of each pixel. Operand f is `.f32` scalar value that specifies depth compare value for depth textures. Each element fetched from texture is compared against value given in f operand. If comparison passes, result is 1.0; otherwise result is 0.0. These per-element comparison results are used for the filtering.

A texture base address is assumed to be aligned to a 16 byte boundary, and the address given by the coordinate vector must be naturally aligned to a multiple of the access size. If an address is not properly aligned, the resulting behavior is undefined; i.e., the access may proceed by silently masking off low-order address bits to achieve proper rounding, or the instruction may fault.

**tld4.2d**

For 2D textures, operand c specifies coordinates as a two-element, 32-bit floating-point vector.

An optional operand e may be specified. Operand e is a vector of type `.v2.s32` that specifies coordinate offset. Offset is applied to coordinates before doing texture fetch. Offset value is in the range of -8 to +7.

**tld4.a2d**

Texture array selection, followed by tld4 texture fetch of 2d texture. For 2d texture arrays operand c is a four element, 32-bit vector. The first element in operand c is interpreted as an unsigned integer index (`.u32`) into the texture array, and the next two elements are interpreted as 32-bit floating point coordinates of 2d texture. The fourth element is ignored.

An optional operand e may be specified. Operand e is a vector of type `.v2.s32` that specifies coordinate offset. Offset is applied to coordinates before doing texture fetch. Offset value is in the range of -8 to +7.

**tld4.cube**

For cubemap textures, operand c specifies four-element vector which comprises three floating-point coordinates (s, t, r) and a fourth padding argument which is ignored.

Cubemap textures are special two-dimensional layered textures consisting of six layers that represent the faces of a cube. All layers in a cubemap are of the same size and are square (i.e., width equals height).

Coordinates (s, t, r) are projected onto one of the six cube faces. The (s, t, r) coordinates can be thought of as a direction vector emanating from the center of the cube. Of the three coordinates (s, t, r), the coordinate of the largest magnitude (the major axis) selects the cube face. Then, the other two coordinates (the minor axes) are divided by the absolute value of the major axis to produce a new (s, t) coordinate pair to lookup into the selected cube face.

Offset vector operand e is not supported for cubemap textures.

**tld4.acube**

Cubemap array selection, followed by tld4 texture fetch of cubemap texture. The first element in operand c is interpreted as an unsigned integer index (`.u32`) into the cubemap texture array, and the remaining three elements are interpreted as floating-point cubemap coordinates (s, t, r), used to lookup in the selected cubemap.

Offset vector operand e is not supported for cubemap texture arrays.

**Indirect texture access**

Beginning with PTX ISA version 3.1, indirect texture access is supported in unified mode for target architecture sm_20 or higher. In indirect access, operand a is a `.u64` register holding the address of a `.texref` variable.

**PTX ISA Notes**

Introduced in PTX ISA version 2.2.

Indirect texture access introduced in PTX ISA version 3.1.

`tld4.{a2d,cube,acube}` introduced in PTX ISA version 4.3.

Offset vector operand introduced in PTX ISA version 4.3.

Depth compare operand introduced in PTX ISA version 4.3.

Support for optional destination predicate introduced in PTX ISA version 7.1.

**Target ISA Notes**

`tld4` requires sm_20 or higher.

Indirect texture access requires sm_20 or higher.

`tld4.{a2d,cube,acube}` requires sm_30 or higher.

Offset vector operand requires sm_30 or higher.

Depth compare operand requires sm_30 or higher.

Support for optional destination predicate requires sm_60 or higher.

**Examples**

```ptx
// Example of unified mode texturing
tld4.r.2d.v4.s32.f32  {r1,r2,r3,r4}, [tex_a,{f1,f2}];

// Example of independent mode texturing
tld4.r.2d.v4.u32.f32  {u1,u2,u3,u4}, [tex_a,smpl_x,{f1,f2}];

// Example of unified mode texturing using offset
tld4.r.2d.v4.s32.f32  {r1,r2,r3,r4}, [tex_a,{f1,f2}], {r5, r6};

// Example of unified mode texturing using compare
tld4.r.2d.v4.f32.f32  {f1,f2,f3,f4}, [tex_a,{f5,f6}], f7;

// Example of optional destination predicate
tld4.r.2d.v4.f32.f32 {f1,f2,f3,f4}|p, [tex_a,{f5,f6}], f7;
```

## 9.7.10.5. Texture Instructions: txq

### txq

Query texture and sampler attributes.

**Syntax**

```
txq.tquery.b32         d, [a];       // texture attributes
txq.level.tlquery.b32  d, [a], lod;  // texture attributes
txq.squery.b32         d, [a];       // sampler attributes

.tquery  = { .width, .height, .depth,
             .channel_data_type, .channel_order,
             .normalized_coords, .array_size,
             .num_mipmap_levels, .num_samples};

.tlquery = { .width, .height, .depth };

.squery  = { .force_unnormalized_coords, .filter_mode,
             .addr_mode_0, addr_mode_1, addr_mode_2 };
```

**Description**

Query an attribute of a texture or sampler. Operand a is either a `.texref` or `.samplerref` variable, or a `.u64` register.

| Query | Returns |
|-------|---------|
| `.width`, `.height`, `.depth` | value in elements |
| `.channel_data_type` | Unsigned integer corresponding to source language's channel data type enumeration. If the source language combines channel data type and channel order into a single enumeration type, that value is returned for both channel_data_type and channel_order queries. |
| `.channel_order` | Unsigned integer corresponding to source language's channel order enumeration. If the source language combines channel data type and channel order into a single enumeration type, that value is returned for both channel_data_type and channel_order queries. |
| `.normalized_coords` | 1 (True) or 0 (False). |
| `.force_unnormalized_coords` | 1 (True) or 0 (False). Defined only for `.samplerref` variables in independent texture mode. Overrides the normalized_coords field of a `.texref` variable used with a `.samplerref` in a tex instruction. |
| `.filter_mode` | Integer from enum { nearest, linear } |
| `.addr_mode_0`, `.addr_mode_1`, `.addr_mode_2` | Integer from enum { wrap, mirror, clamp_ogl, clamp_to_edge, clamp_to_border } |
| `.array_size` | For a texture array, number of textures in array, 0 otherwise. |
| `.num_mipmap_levels` | For a mipmapped texture, number of levels of details (LOD), 0 otherwise. |
| `.num_samples` | For a multi-sample texture, number of samples, 0 otherwise. |

Texture attributes are queried by supplying a `.texref` argument to txq. In unified mode, sampler attributes are also accessed via a `.texref` argument, and in independent mode sampler attributes are accessed via a separate `.samplerref` argument.

**txq.level**

`txq.level` requires an additional 32bit integer argument, lod, which specifies LOD and queries requested attribute for the specified LOD.

**Indirect texture access**

Beginning with PTX ISA version 3.1, indirect texture access is supported in unified mode for target architecture sm_20 or higher. In indirect access, operand a is a `.u64` register holding the address of a `.texref` variable.

**PTX ISA Notes**

Introduced in PTX ISA version 1.5.

Channel data type and channel order queries were added in PTX ISA version 2.1.

The `.force_unnormalized_coords` query was added in PTX ISA version 2.2.

Indirect texture access introduced in PTX ISA version 3.1.

`.array_size`, `.num_mipmap_levels`, `.num_samples` queries were added in PTX ISA version 4.1.

`txq.level` introduced in PTX ISA version 4.3.

**Target ISA Notes**

Supported on all target architectures.

Indirect texture access requires sm_20 or higher.

Querying the number of mipmap levels requires sm_20 or higher.

Querying the number of samples requires sm_30 or higher.

`txq.level` requires sm_30 or higher.

**Examples**

```ptx
txq.width.b32       %r1, [tex_A];
txq.filter_mode.b32 %r1, [tex_A];   // unified mode
txq.addr_mode_0.b32 %r1, [smpl_B];  // independent mode
txq.level.width.b32 %r1, [tex_A], %r_lod;
```

## 9.7.10.6. Texture Instructions: istypep

### istypep

Query whether a register points to an opaque variable of a specified type.

**Syntax**

```
istypep.type   p, a;  // result is .pred

.type = { .texref, .samplerref, .surfref };
```

**Description**

Write predicate register p with 1 if register a points to an opaque variable of the specified type, and with 0 otherwise. Destination p has type `.pred`; the source address operand must be of type `.u64`.

**PTX ISA Notes**

Introduced in PTX ISA version 4.0.

**Target ISA Notes**

`istypep` requires sm_30 or higher.

**Examples**

```ptx
istypep.texref istex, tptr;
istypep.samplerref issampler, sptr;
istypep.surfref issurface, surfptr;
```
