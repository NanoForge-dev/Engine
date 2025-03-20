var<private> VERTICES: array<vec2<f32>, 3> = array<vec2<f32>, 3>(
    vec2<f32>(-1.7321,-1.0),
    vec2<f32>( 1.7321,-1.0),
    vec2<f32>( 0.0   , 2.0),
);

struct View {
    position: vec4<f32>,
    scale: vec2<f32>,
    size: vec2<f32>,
};

@group(0)
@binding(0)
var<uniform> view: View;

struct VertexInput {
    @builtin(vertex_index) index: u32
};

struct InstanceInput {
    @location(0) position: vec2<f32>,
    @location(1) radius: f32,
    @location(2) color: vec4<f32>,
};

struct VertexOutput {
    @builtin(position) clip_space: vec4<f32>,
    @location(0) local_space: vec2<f32>,
    @location(1) color: vec4<f32>,
    @location(2) pixel_size: f32,
};

@vertex
fn vertex_main(
    vertex: VertexInput,
    instance: InstanceInput,
) -> VertexOutput {
    var out: VertexOutput;

    let x = view.size.x;
    let y = view.size.y;
    let aspect = y / x;

    let local_space = VERTICES[vertex.index];

    var position = instance.position;
    var radius = instance.radius;
    if radius * y < 1.414214 * view.scale.x {
        let a = (position - view.position.xy) / view.scale.x;
        let b = (floor(a * y) + 0.5) / y;
        let c = b * view.scale.x + view.position.xy;
        position = c;
        radius = 1.414214 * view.scale.x / y;
    }

    let world_space = local_space * radius + position;

    let view_space = (world_space - view.position.xy) / view.scale.x;

    let clip_space = vec4<f32>(view_space.x * aspect, view_space.y, 0.0, 1.0);

    out.clip_space  = clip_space;
    out.local_space = local_space;
    out.color       = vec4(pow(instance.color.rgb, vec3(2.2)), instance.color.a);
    out.pixel_size  = view.scale.x / (radius * y);
    return out;
}

@fragment
fn fragment_main(in: VertexOutput) -> @location(0) vec4<f32> {
    let alpha = 1.0 - smoothstep(1.0 - 3.0 * in.pixel_size, 1.0, length(in.local_space));
    return vec4<f32>(in.color.rgb, in.color.a * alpha);
}
