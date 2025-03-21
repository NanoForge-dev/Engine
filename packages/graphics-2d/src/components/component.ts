import type { GraphicsCore } from "../core";
import type { ShaderManager } from "../shader/shader.manager";

export abstract class NfgComponent {
  private readonly _core: GraphicsCore;
  protected readonly _shaderManager: ShaderManager;
  private _vertices: Float32Array;
  protected _vertexBuffer: GPUBuffer;
  protected abstract _vertexLength: number;
  protected abstract readonly _vertexBufferLayout: GPUVertexBufferLayout;
  private _uniformBuffer: GPUBuffer;
  protected abstract _shader: GPUShaderModule;
  private _pipeline: GPURenderPipeline;
  private readonly _pipelineLayout: GPUPipelineLayout;
  private readonly _label: string;
  private _bindGroup: GPUBindGroup;
  protected _duplicate: number = 1;

  constructor(core: GraphicsCore) {
    this._core = core;
    this._shaderManager = core.shaderManager;
    this._label = `${this.constructor.name} - ${Date.now()}`;

    const bindGroupLayout = this._core.device.createBindGroupLayout({
      label: `${this._label} Bind Group Layout`,
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: {},
        },
      ],
    });

    this._pipelineLayout = this._core.device.createPipelineLayout({
      label: `${this._label} Pipeline Layout`,
      bindGroupLayouts: [bindGroupLayout],
    });
  }

  public async init(): Promise<typeof this> {
    await this._init();
    this.updateUniforms();
    this._updatePipeline();
    return this;
  }

  public draw(pass: GPURenderPassEncoder): void {
    pass.setPipeline(this._pipeline);
    pass.setBindGroup(0, this._bindGroup);
    pass.setVertexBuffer(0, this._vertexBuffer);
    pass.draw(this._vertices.length / this._vertexLength, this._duplicate);
  }

  public updateUniforms(): void {
    const uniformArray = new Float32Array([
      0,
      0,
      0,
      1,
      1,
      1,
      this._core.initContext.canvas.width,
      this._core.initContext.canvas.height,
    ]);
    if (!this._uniformBuffer)
      this._uniformBuffer = this._core.device.createBuffer({
        label: "View Uniforms",
        size: uniformArray.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });
    this._core.device.queue.writeBuffer(this._uniformBuffer, 0, uniformArray);
  }

  protected abstract _init(): Promise<void>;

  protected _setVertices(raw: number[]): void {
    const len = this._vertices?.byteLength ?? -1;
    this._vertices = new Float32Array(raw);
    if (len !== this._vertices.byteLength) this._updateVertexBuffer();
    else this._writeVertexBuffer();
  }

  protected _updateVertexBuffer(): void {
    this._vertexBuffer = this._core.device.createBuffer({
      label: `${this._label} vertices`,
      size: this._vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this._writeVertexBuffer();
  }

  protected _writeVertexBuffer(): void {
    this._core.device.queue.writeBuffer(this._vertexBuffer, 0, this._vertices);
  }

  protected _updatePipeline(): void {
    this._pipeline = this._core.device.createRenderPipeline({
      label: `${this._label} pipeline`,
      layout: this._pipelineLayout,
      vertex: {
        module: this._shader,
        entryPoint: "vertex_main",
        buffers: [this._vertexBufferLayout],
      },
      fragment: {
        module: this._shader,
        entryPoint: "fragment_main",
        targets: [
          {
            format: this._core.render.canvasFormat,
          },
        ],
      },
    });
    this._updateBindGroup();
  }

  protected _updateBindGroup(): void {
    this._bindGroup = this._core.device.createBindGroup({
      label: `${this._label} renderer bind group`,
      layout: this._pipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: { buffer: this._uniformBuffer },
        },
      ],
    });
  }
}
