#include <stdlib.h>
#include "gl_proxy_manager.hpp"

namespace demo {

Nan::Persistent<v8::Function> GLProxyManager::constructor;

NAN_MODULE_INIT(GLProxyManager::Init)
{
    v8::Local<v8::FunctionTemplate> tpl = Nan::New<v8::FunctionTemplate>(New);
    tpl->SetClassName(Nan::New("GLProxyManager").ToLocalChecked());
    tpl->InstanceTemplate()->SetInternalFieldCount(1);
    SetPrototypeMethod(tpl, "getValue", GetValue);
    SetPrototypeMethod(tpl, "setManager", SetManager);
    SetPrototypeMethod(tpl, "render", Render);

    constructor.Reset(Nan::GetFunction(tpl).ToLocalChecked());
    Nan::Set(target, Nan::New("GLProxyManager").ToLocalChecked(),
             Nan::GetFunction(tpl).ToLocalChecked());
}

NAN_METHOD(GLProxyManager::New)
{
    if (info.IsConstructCall()) {
        double value = info[0]->IsUndefined() ? 0 : Nan::To<double>(info[0]).FromJust();
        GLProxyManager* obj = new GLProxyManager(value);
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

    printf("SetManager(%p)\n", obj);
    obj->mgr_.Reset(maybe1.ToLocalChecked());
}

constexpr int VERTEX_SIZE = 3; // vec3
constexpr int COLOR_SIZE  = 4; // vec4
constexpr int VERTEX_NUMS = 6;

NAN_METHOD(GLProxyManager::Init)
{
    v8::Local<v8::Context> context = info.GetIsolate()->GetCurrentContext();
    GLProxyManager* obj = Nan::ObjectWrap::Unwrap<GLProxyManager>(info.Holder());
    if (info.Length() != 1) {
        printf("Invalid num args: %d\n", info.Length());
        return;
    }

    if (!info[0]->IsInt32()) {
        printf("Invalid arg type\n");
        return;
    }

    int wgt_id = info[0]->Int32Value(context).FromJust();

    printf("render %d\n", wgt_id);

    // Allocate vertex buffer
    bufsize_ = sizeof(float) * VERTEX_NUMS * (VERTEX_SIZE + COLOR_SIZE); 
    {
        auto xxx =
            Nan::Get(Nan::New(obj->mgr_), Nan::New("allocBuffer").ToLocalChecked())
                .ToLocalChecked();
        auto callback = v8::Local<v8::Function>::Cast(xxx);
        Nan::Callback cb(callback);

        const int argc = 2;
        v8::Local<v8::Value> argv[2] = {Nan::New(wgt_id),
                                        Nan::New(bufsize)};
        Nan::AsyncResource resource("demo:alloc_buffer");
        auto rval = cb(&resource, Nan::New(obj->mgr_), argc, argv).ToLocalChecked();
        bufid_ = rval->Int32Value(context).FromJust();
        printf("alloc buffer ID: %d\n", bufid_);
    }
}

NAN_METHOD(GLProxyManager::Render)
{
    if (bufid_ < 0) {
        printf("invalid buffer ID: %d\n", bufid_);
    }

    v8::Local<v8::Context> context = info.GetIsolate()->GetCurrentContext();

    GLProxyManager* obj = Nan::ObjectWrap::Unwrap<GLProxyManager>(info.Holder());

    char *buffer = nullptr;
    size_t size = 0;
    {
        auto xxx =
            Nan::Get(Nan::New(obj->mgr_), Nan::New("getBufferPtr").ToLocalChecked())
                .ToLocalChecked();
        auto callback = v8::Local<v8::Function>::Cast(xxx);
        Nan::Callback cb(callback);

        const int argc = 1;
        v8::Local<v8::Value> argv[1] = {Nan::New(bufid_)};
        Nan::AsyncResource resource("test:get_buffer_ptr");
        auto rval = cb(&resource, Nan::New(obj->mgr_), argc, argv).ToLocalChecked();

        if (rval->IsObject()) {
            buffer = node::Buffer::Data(rval->ToObject(context).ToLocalChecked());
            size = node::Buffer::Length(rval);
            printf("buffer ptr: %p, size %d\n", buffer, size);
        }
    }

    for (size_t i = 0; i < size; ++i) {
        // buffer[i] = i;
        // buffer[i] = rand() % 0xFF;
        buffer[i] = i % 0xFF;
    }

    {
        auto xxx =
            Nan::Get(Nan::New(obj->mgr_), Nan::New("drawBuffer").ToLocalChecked())
                .ToLocalChecked();
        auto callback = v8::Local<v8::Function>::Cast(xxx);
        Nan::Callback cb(callback);

        const int argc = 2;
        v8::Local<v8::Value> argv[3] = {Nan::New(wgt_id),
                                        Nan::New(bufid)};
        Nan::AsyncResource resource("test:draw_buffer");
        auto rval = cb(&resource, Nan::New(obj->mgr_), argc, argv).ToLocalChecked();
        bool bok = rval->Int32Value(context).FromJust();
        printf("draw buffer OK: %d\n", bok);
    }
}

}  // namespace demo
