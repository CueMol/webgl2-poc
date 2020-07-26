#include "gl_proxy_manager.hpp"

#include <stdlib.h>

#include <algorithm>

namespace demo {

Nan::Persistent<v8::Function> GLProxyManager::constructor;

NAN_MODULE_INIT(GLProxyManager::Init)
{
    v8::Local<v8::FunctionTemplate> tpl = Nan::New<v8::FunctionTemplate>(New);

    // Define Class Name
    tpl->SetClassName(Nan::New("GLProxyManager").ToLocalChecked());

    // ??
    tpl->InstanceTemplate()->SetInternalFieldCount(1);

    // Method Defs
    // SetPrototypeMethod(tpl, "getValue", GetValue);
    SetPrototypeMethod(tpl, "setManager", SetManager);
    SetPrototypeMethod(tpl, "create", Create);
    SetPrototypeMethod(tpl, "render", Render);

    // Ctor ??
    constructor.Reset(Nan::GetFunction(tpl).ToLocalChecked());
    Nan::Set(target, Nan::New("GLProxyManager").ToLocalChecked(),
             Nan::GetFunction(tpl).ToLocalChecked());
}

NAN_METHOD(GLProxyManager::New)
{
    if (info.IsConstructCall()) {
        double value = info[0]->IsUndefined() ? 0 : Nan::To<double>(info[0]).FromJust();
        GLProxyManager* obj = new GLProxyManager();
        obj->Wrap(info.This());
        info.GetReturnValue().Set(info.This());
    } else {
        const int argc = 1;
        v8::Local<v8::Value> argv[argc] = {info[0]};
        v8::Local<v8::Function> cons = Nan::New(constructor);
        // info.GetReturnValue().Set(cons->NewInstance(argc, argv));
        info.GetReturnValue().Set(Nan::NewInstance(cons, argc, argv).ToLocalChecked());
    }
}

// NAN_METHOD(GLProxyManager::GetValue)
// {
//     GLProxyManager* obj = Nan::ObjectWrap::Unwrap<GLProxyManager>(info.Holder());
//     info.GetReturnValue().Set(obj->value_);

//     auto xxx = Nan::Get(Nan::New(obj->mgr_), Nan::New("getX").ToLocalChecked())
//                    .ToLocalChecked();
//     auto callback = v8::Local<v8::Function>::Cast(xxx);
//     Nan::Callback cb(callback);

//     // const int argc = 0;
//     // v8::Local<v8::Value> argv[0];
//     Nan::AsyncResource resource("test:get_value");
//     cb(&resource, Nan::New(obj->mgr_));
//     // cb(&resource, Nan::New(obj->mgr_), argc, argv);
// }

NAN_METHOD(GLProxyManager::SetManager)
{
    GLProxyManager* obj = Nan::ObjectWrap::Unwrap<GLProxyManager>(info.Holder());
    if (info.Length() != 1) {
        printf("Invalid num args: %d\n", info.Length());
        return;
    }

    Nan::MaybeLocal<v8::Object> maybe1 = Nan::To<v8::Object>(info[0]);
    if (maybe1.IsEmpty()) {
        printf("arg0 is empty\n");
        return;
    }

    obj->mgr_.Reset(maybe1.ToLocalChecked());

    printf("SetManager(%p) OK\n", obj);
}

// constexpr float vertices_orig[] = {
//     -30, 30,  0.0, 1.0, 0.0, 0.0, 1.0, -30, -30, 0.0, 0.0, 1.0, 0.0, 1.0,
//     30,  30,  0.0, 0.0, 0.0, 1.0, 1.0, -30, -30, 0.0, 0.0, 1.0, 0.0, 1.0,
//     30,  -30, 0.0, 0.0, 0.0, 0.0, 1.0, 30,  30,  0.0, 0.0, 0.0, 1.0, 1.0,
// };
constexpr float tri_size = 10.0;
constexpr float vertices_orig[] = {
    -tri_size, tri_size,  0.0, 1.0, 0.0, 0.0, 1.0,
    -tri_size, -tri_size, 0.0, 0.0, 1.0, 0.0, 1.0,
    tri_size,  tri_size,  0.0, 0.0, 0.0, 1.0, 1.0,
    -tri_size, -tri_size, 0.0, 0.0, 1.0, 0.0, 1.0,
    tri_size,  -tri_size, 0.0, 0.0, 0.0, 0.0, 1.0,
    tri_size,  tri_size,  0.0, 0.0, 0.0, 1.0, 1.0,
};

float* GLProxyManager::getBuffer(int bufid)
{
    auto xxx = Nan::Get(Nan::New(mgr_), Nan::New("getBuffer").ToLocalChecked())
                   .ToLocalChecked();
    auto callback = v8::Local<v8::Function>::Cast(xxx);
    Nan::Callback cb(callback);
    const int argc = 1;
    v8::Local<v8::Value> argv[1] = {Nan::New(bufid)};
    Nan::AsyncResource resource("demo:get_buffer");
    auto rval = cb(&resource, Nan::New(mgr_), argc, argv);

    auto array = v8::Local<v8::ArrayBufferView>::Cast(rval.ToLocalChecked());
    v8::Local<v8::ArrayBuffer> buffer = array->Buffer();
    float* data = static_cast<float*>(buffer->GetContents().Data());
    // size_t len = array->ByteLength();
    // printf("buffer ptr: %p, size %d\n", data, len / sizeof(float));

    return data;
}

// Create
NAN_METHOD(GLProxyManager::Create)
{
    v8::Local<v8::Context> context = info.GetIsolate()->GetCurrentContext();
    GLProxyManager* obj = Nan::ObjectWrap::Unwrap<GLProxyManager>(info.Holder());
    if (info.Length() != 0) {
        printf("Invalid num args: %d\n", info.Length());
        return;
    }

    // CreateBuffer(bufsize, nelems) -> buf_id
    int bufsize = VERTEX_NUMS * (VERTEX_SIZE + COLOR_SIZE);
    {
        auto xxx =
            Nan::Get(Nan::New(obj->mgr_), Nan::New("createBuffer").ToLocalChecked())
                .ToLocalChecked();
        auto callback = v8::Local<v8::Function>::Cast(xxx);
        Nan::Callback cb(callback);

        const int argc = 2;
        v8::Local<v8::Value> argv[2] = {Nan::New(bufsize), Nan::New(VERTEX_NUMS)};
        Nan::AsyncResource resource("demo:alloc_buffer");
        auto rval = cb(&resource, Nan::New(obj->mgr_), argc, argv);

        obj->bufid_ = rval.ToLocalChecked()->Int32Value(context).FromJust();
        printf("buffer ID: %d\n", obj->bufid_);
    }

    // GetBuffer(buf_id) -> buf_ptr
    float* data = obj->getBuffer(obj->bufid_);
    // {
    //     auto xxx = Nan::Get(Nan::New(obj->mgr_),
    //     Nan::New("getBuffer").ToLocalChecked())
    //                    .ToLocalChecked();
    //     auto callback = v8::Local<v8::Function>::Cast(xxx);
    //     Nan::Callback cb(callback);
    //     const int argc = 1;
    //     v8::Local<v8::Value> argv[1] = {Nan::New(this.bufid_)};
    //     Nan::AsyncResource resource("demo:get_buffer");
    //     auto rval = cb(&resource, Nan::New(obj->mgr_), argc, argv);

    //     auto array = v8::Local<v8::ArrayBufferView>::Cast(rval.ToLocalChecked());
    //     v8::Local<v8::ArrayBuffer> buffer = array->Buffer();
    //     data = static_cast<float*>(buffer->GetContents().Data());
    //     size_t len = array->ByteLength();
    //     printf("buffer ptr: %p, size %d\n", data, len / sizeof(float));
    // }

    // Initialize vertex buffer
    {
        for (int i = 0; i < VERTEX_NUMS / 6; ++i) {
            // for (int i = 0; i < 10; ++i) {
            const int bias = i * 6 * STRIDE_SIZE;
            for (int j = 0; j < 6 * STRIDE_SIZE; ++j) {
                data[bias + j] = vertices_orig[j];
                if (bufsize <= bias + j) {
                    printf("XXXXXXXXXXXXXXXXXXX buffer overrun\n");
                }
            }
        }
    }
}

// void buffer_delete_callback(char* data, void* the_vector)
// {
//     printf("XXX buffer_delete_callback called!! %p, %p\n", data, the_vector);
// }

// NAN_METHOD(GLProxyManager::Render)
// {
//     // printf("GLProxyManager::Render Called\n");

//     v8::Local<v8::Context> context = info.GetIsolate()->GetCurrentContext();

//     GLProxyManager* obj = Nan::ObjectWrap::Unwrap<GLProxyManager>(info.Holder());

//     if (info.Length() != 1) {
//         printf("Invalid num args: %d\n", info.Length());
//         return;
//     }

//     if (!info[0]->IsObject()) {
//         printf("Invalid arg type\n");
//         return;
//     }

//     auto array = v8::Local<v8::ArrayBufferView>::Cast(info[0]);
//     v8::Local<v8::ArrayBuffer> buffer = array->Buffer();
//     // char *data = static_cast<char*>(buffer->GetBackingStore()->Data());
//     char* data = static_cast<char*>(buffer->GetContents().Data());
//     // printf("buffer ptr: %p, size %d\n", data, array->ByteLength());
//     obj->updateData(reinterpret_cast<float*>(data));

//     // Nan::TypedArrayContents<float> buffer(info[0]);
//     // char* buffer =
//     node::Buffer::Data(info[0]->ToObject(context).ToLocalChecked());
//     // size_t size = node::Buffer::Length(info[0]);
//     // printf("buffer ptr: %p, size %d\n", &(*buffer)[0], buffer.length());
//     // obj->updateData(&(*buffer)[0]);
// }

NAN_METHOD(GLProxyManager::Render)
{
    v8::Local<v8::Context> context = info.GetIsolate()->GetCurrentContext();
    GLProxyManager* obj = Nan::ObjectWrap::Unwrap<GLProxyManager>(info.Holder());

    float* data = obj->getBuffer(obj->bufid_);
    obj->updateData(data);

    // sendBuffer(bufid) -> void
    {
        auto xxx = Nan::Get(Nan::New(obj->mgr_), Nan::New("sendBuffer").ToLocalChecked())
                       .ToLocalChecked();
        auto callback = v8::Local<v8::Function>::Cast(xxx);
        Nan::Callback cb(callback);
        const int argc = 1;
        v8::Local<v8::Value> argv[1] = {Nan::New(obj->bufid_)};
        Nan::AsyncResource resource("demo:send_buffer");
        cb(&resource, Nan::New(obj->mgr_), argc, argv);
    }
}

}  // namespace demo
